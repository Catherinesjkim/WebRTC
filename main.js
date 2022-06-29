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

// this init function will trigger the second a user loads a page
init()

document.getElementById('create-offer').addEventListener('click', createOffer)