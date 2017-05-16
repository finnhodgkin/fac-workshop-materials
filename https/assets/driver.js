/* global document, EndPoint, VideoEndPoint */
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    // Application logic here
    const V1 = new VideoEndPoint('V1');
    const V2 = new VideoEndPoint('V2');
    V1.send('V2', 'CALL_REQUEST', {a: 'hhi frenz'});

  });
})();
