// create SDP Offer - source of truth for any connection
// one object that's going to represent all the info about this connection
// local stream, etc. will be added here and allow us to connect

// how we are going to generate ICE candidates from
let peerConnection;

// 2 undefined variables- when I get the video and audio feed from our users, I am going to store them inside
let localStream;
let remoteStream;

// set up STUN server - free from Google - port: 19302 - a list of an object with two URLs
let servers = {
    iceServers: [
        {
            urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
        }
    ]
}
// how we are going to generate ICE candidates from


// get the user's audio and video stream and display it on the DOM - is camera on?
let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
    document.getElementById('user-1').srcObject = localStream
}

// create an offer - alwasy add an async function - peer connection object
// add servers object into the create offer because we want to let it know which STUN server to use
// add all ICE candidates to the Offer
let createOffer = async () => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = async (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) =>{
        if(event.candidate) {
            document.getElementById('offer-sdp').value = JSON.stringify(peerConnection.localDescription)
        }
    }

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    document.getElementById('offer-sdp').value = JSON.stringify(offer)
}

let createAnswer = async () => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = async (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) =>{
        if(event.candidate) {
            document.getElementById('offer-sdp').value = JSON.stringify(peerConnection.localDescription)
        }
    }

    let offer = document.getElementById('offer-sdp').value
    if(!offer) return alert('Retrieve offer from peer first...')

    offer = JSON.parse(offer)
    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    document.getElementById('answer-sdp').value = JSON.stringify(answer)
}

// add a function called Answer - create remote description with answer from the offer of local description
// get the answer from the DOM 
let addAnswer = async () => {
    let answer = document.getElementById('answer-sdp').value
    if(!answer) return alert('Retrieve answer from peer first...')

    answer = JSON.parse(answer)

    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
    
}

// this init function will trigger the second a user loads a page
init()

// Add an event listener on the DOM 
document.getElementById('create-offer').addEventListener('click', createOffer)
document.getElementById('create-answer').addEventListener('click', createAnswer)
document.getElementById('add-answer').addEventListener('click', addAnswer)