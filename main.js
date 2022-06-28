// 2 undifined variables - when we get the video and audio feed from our users, we are going to store them inside

let localStream;
let remoteStream;

let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})

    document.getElementById('user-1').srcObject = localStream
}

init()