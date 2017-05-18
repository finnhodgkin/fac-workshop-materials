/* global document, EndPoint, VideoEndPoint */
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    // Application logic here
    const allTheEndpoints = {};
    document.querySelectorAll('.caller').forEach((e) => {
      const videoId = e.id;
      const videoYou = e.querySelector('.video');
      const videoMe = e.querySelector('.video--me');
      const videoState = e.querySelector('.state');
      allTheEndpoints[videoId] = new VideoEndPoint(videoId, videoYou, videoMe, videoState);
    });

    document.querySelectorAll(".call").forEach((e) => {
      e.addEventListener('click', () => {
        const callerId = e.parentNode.id;
        const target = e.parentNode.querySelector('input').value;
        allTheEndpoints[callerId].startCall(target);
      });
    });

    document.querySelectorAll(".hangup").forEach((e) => {
      e.addEventListener('click', () => {
        const callerId = e.parentNode.id;
        allTheEndpoints[callerId].hangUpCall();
      });
    });

  });
})();
