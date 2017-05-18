/* global document, EndPoint */
const VideoEndPoint = (function() {
  /** @class VideoEndPoint
   *  @description Specialisation of the generic EndPoint. Each instance of this class
   *  represents an actual video UI end point.
   */
  class VideoEndPoint extends EndPoint {
    constructor(ep_name, videoYou, videoMe, state) {
      // Create a poller for this client.w
      super(ep_name);
      this.videoYou = videoYou;
      this.videoMe = videoMe;
      this.DOMstate = state;
      this.state = 'IDLE';
      this.inCallWith = null;
      this.userMediaPromise = navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setInterval(() => this.pollForEvents(), 2000);
    }
    /**
     * [attachMedia description]
     * @param  {[type]} media [description]
     * @return {[type]}       [description]
     */
    attachMedia(media) {
      this.userMediaPromise.then(stream => {
        media.srcObject = stream;
        media.play();
      });
    }
    /**
     * @method setState
     * @param {String} newState
     */
    setState(newState) {
      this.DOMstate.innerText = newState;
      console.log(
        `state of ${this._name} changed from ${this.state} to ${newState}`
      );
      this.state = newState;
    }
    /**
     * Decide whether to accept a call
     * @param  {String} from Name of caller
     * @param  {Object} data Data passed from caller
     */
    callRequest(from, data) {
      if (this.state === 'IDLE') {
        this.setState('CALLED');
        this.inCallWith = from;
        this.send(from, 'ACCEPT_CALL', { a: 'HHEEEEEY' });
        this.attachMedia(this.videoMe);
      } else {
        this.send(from, 'DENIED', { a: 'DENNY (half-orc thorns n stuff)' });
      }
    }
    acceptCall(from, data) {
      this.setState('CALLER');
      this.inCallWith = from;
      this.userMediaPromise.then(localStream => {
        this.peerConnection = new RTCPeerConnection();

        this.peerConnection.onaddstream = ({ stream }) => {
          this.videoYou.srcObject = stream;
          this.videoYou.play();
        };

        this.peerConnection.onicecandidate = e => {
          if (e.candidate) {
            this.send(from, 'ICE_CANDIDATE', e.candidate);
          }
        };

        this.peerConnection.addStream(localStream);

        this.peerConnection
          .createOffer({ offerToReceiveVideo: 1, offerToReceiveAudio: 0 })
          .then(offer => {
            this.peerConnection.setLocalDescription(offer);
            this.send(from, 'SDP_OFFER', offer);
            this.attachMedia(this.videoMe);
          });
      });
    }
    sdpOffer(from, offer) {
      this.userMediaPromise.then(localStream => {
        this.peerConnection = new RTCPeerConnection();

        this.peerConnection.onaddstream = ({ stream }) => {
          this.videoYou.srcObject = stream;
          this.videoYou.play();
        };

        this.peerConnection.onicecandidate = e => {
          console.log(e);
          if (e.candidate) this.send(from, 'ICE_CANDIDATE', e.candidate);
        };

        this.peerConnection.addStream(localStream);

        this.peerConnection.setRemoteDescription(offer).then(() => {
          this.peerConnection.createAnswer().then(answer => {
            this.peerConnection.setLocalDescription(answer);
            this.send(from, 'SDP_ANSWER', answer);
          });
        });
      });
    }
    sdpAnswer(from, offer) {
      this.peerConnection
        .setRemoteDescription(offer)
        .then(() => this.log('SET REMOTE ON BOTH SIDES'));
    }
    iceCandidate(from, data) {
      console.log(data);
      const candidate = new RTCIceCandidate(data);
      console.log(candidate);
      this.peerConnection.addIceCandidate(candidate);
    }
    endCall(from, data) {
      this.setState('IDLE');
      this.inCallWith = null;
      this.peerConnection.close();
      delete this.peerConnection;
      this.videoMe.srcObject = null;
    }
    denied(from, data) {
      this.setState('IDLE');
      alert(`User ${from} not there.`);
    }
    /** @method receive
     *  @description Entry point called by the base class when it receives a message for this object from another EndPoint.
     *  @param {String} from - the directory name of the remote EndPoint that sent this request
     *  @param {String} operation - the text string identifying the name of the method to invoke
     *  @param {Object} [data] - the opaque parameter set passed from the remote EndPoint to be sent to the method handler
     */
    // Provide the required 'receive' method
    receive(from, operation, data) {
      this.log(`END POINT RX PROCESSING... ("${from}", "${operation}")`, data);
      switch (operation) {
        case 'CALL_REQUEST':
          this.callRequest(from, data);
          break;
        case 'DENIED':
          this.denied(from, data);
          break;
        case 'ACCEPT_CALL':
          this.acceptCall(from, data);
          break;
        case 'SDP_OFFER':
          this.sdpOffer(from, data);
          break;
        case 'SDP_ANSWER':
          this.sdpAnswer(from, data);
          break;
        case 'ICE_CANDIDATE':
          this.iceCandidate(from, data);
          break;
        case 'END_CALL':
          this.endCall(from, data);
          break;
      }
    }

    pollForEvents() {
      const url = `/poll/${this._name}`;
      console.log(url);
      fetch(url).then(res => res.json()).then(json => {
        const messageArray = json.messages;
        messageArray.forEach(message => {
          console.log(message);
          this.receive(message.from, message.method, JSON.parse(message.data));
        });
      });
    }
    /** @method hangupCall
     *  @description The localEndPoint (THIS) wants to terminate the call. This is generally the result of the user
     *  clicking the hang-up button. We call our local 'endCall' method and then send 'END_CALL' to the remote party.
     */
    hangUpCall() {
      if (this.inCallWith) {
        this.setState('IDLE');
        this.send(this.inCallWith, 'END_CALL', { a: 'END IT ALL!' });
        this.inCallWith = null;
        this.peerConnection.close();
        delete this.peerConnection;
        this.videoMe.srcObject = null;
      }
    }
    /** @method startCall
     *  @description The user wants to make a call to a remote EndPoint (target). This first part of the process
     *  is to send a message to the target to request the call. The remote EndPoint may accept the call by sending
     *  'ACCEPT_CALL' or decline the call by sending 'DENIED'. Nothing happens at our end other than to send the
     *  message requesting the call. The actuall call is set up if the remote station accepts and sends 'ACCEPT_CALL'.
     *
     *  If the local EndPoint (this) is already in a call (_state is NOT IDLE) then we refuse to start another call.
     *  @param {String} target - the name of the remote party that we want to start a call with
     */
    startCall(target) {
      if (this.state === 'IDLE' && target !== this._name) {
        this.setState('RINGING');
        this.send(target, 'CALL_REQUEST', { a: 'i am some data' });
      }
    }
  }
  return VideoEndPoint;
})();
