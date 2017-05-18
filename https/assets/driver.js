/* global document, EndPoint, VideoEndPoint */
(function() {
  document.querySelector('#your-name').addEventListener('click', function() {
    // Application logic here
    document.querySelector('.caller').id = document.querySelector(
      '#name-field'
    ).value;
    document.querySelector('.container').style.display = 'inline';
    document.querySelector('#name-thing').style.display = 'none';

    const allTheEndpoints = {};
    document.querySelectorAll('.caller').forEach(e => {
      const videoId = e.id;
      const videoYou = e.querySelector('.video');
      const videoMe = e.querySelector('.video--me');
      const videoState = e.querySelector('.state');
      console.log(videoId);
      allTheEndpoints[videoId] = new VideoEndPoint(
        videoId,
        videoYou,
        videoMe,
        videoState
      );
    });

    document.querySelectorAll('.call').forEach(e => {
      e.addEventListener('click', () => {
        const callerId = e.parentNode.id;
        const target = e.parentNode.querySelector('input').value;
        allTheEndpoints[callerId].startCall(target);
      });
    });

    document.querySelectorAll('.hangup').forEach(e => {
      e.addEventListener('click', () => {
        const callerId = e.parentNode.id;
        allTheEndpoints[callerId].hangUpCall();
      });
    });
  });
})();
