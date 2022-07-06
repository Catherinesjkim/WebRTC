// create SDP Offer - source of truth for any connection
// one object that's going to represent all the info about this connection
// local stream, etc. will be added here and allow us to connect
// use Agora RTM SDK for signaling
let APP_ID = 'APP_ID'

// how we are going to generate ICE candidates from
let peerConnection;

// 2 undefined variables- when I get the video and audio feed from our users, I am going to store them inside
let localStream;
let remoteStream;

// make sure each use has their own uinique ID in a string and random number to avoid dupes
let uid = String(Math.floor(Math.random() * 10000))

// authentication to App ID only. Update with a token later for prod env.
let token = null;

// entire interface for client connection 
let client; 

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
    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({uid, token})

    const channel = client.createChannel('main')
    channel.join()

    channel.on('MemberJoined', handlePeerJoined)
    client.on('MessageFromPeer', handleMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
    document.getElementById('user-1').srcObject = localStream
}

// which peer joined and see their unique ID. The function that handles the event
let handlePeerJoined = async (MemberId) => {
    console.log('A new peer has joined this room:', MemberId)
    createOffer(MemberId)
}

// function that handles the event of sending a message in text
// create an offer
// create a candidate, could be sent more than one
// create an answer, triggered when an offer is sent over
let handleMessageFromPeer = async (message, MemberId) => {
    message = JSON.parse(message.text)
    console.log('Message:', message.type)
    
    if(message.type === 'offer') {
        if(!localStream){
            localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
            document.getElementById('user-1').srcObject = localStream

        }
        document.getElementById('offer-sdp').value = JSON.stringify(message.offer)
        createAnswer(MemberId)
    }

    if(message.type === 'answer') {
        document.getElementById('answer-sdp').value = JSON.stringify(message.answer)
        addAnswer()
    }

    if(message.type === 'candidate') {
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }

    }
}

// clean up - create a new function called createPeerConnection
// createIceCandidate
let createPeerConnection = async (sdpType, MemberId) => {
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
            document.getElementById(sdpType).value = JSON.stringify(peerConnection.localDescription)
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate': event.candidate})}, MemberId)
        }
    }

}

// create an offer - alwasy add an async function - peer connection object
// add servers object into the create offer because we want to let it know which STUN server to use
// add all ICE candidates to the Offer
let createOffer = async (MemberId) => {

    createPeerConnection('offer-sdp', MemberId)

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    document.getElementById('offer-sdp').value = JSON.stringify(offer)
    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer': offer})}, MemberId)
}

let createAnswer = async (MemberId) => {
    createPeerConnection('answer-sdp', MemberId)
    

    let offer = document.getElementById('offer-sdp').value
    if(!offer) return alert('Retrieve offer from peer first...')

    offer = JSON.parse(offer)
    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    document.getElementById('answer-sdp').value = JSON.stringify(answer)
    client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer': answer})}, MemberId)
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
// document.getElementById('create-offer').addEventListener('click', createOffer)
// document.getElementById('create-answer').addEventListener('click', createAnswer)
// document.getElementById('add-answer').addEventListener('click', addAnswer)
