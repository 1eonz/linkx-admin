document.title = `${document.title} | Assessment B mutable preflight`;
const script = document.createElement('script');
script.dataset.assessment = 'B';
script.src = 'http://127.0.0.1:8400/detect.js?token=__IMPECCABLE_TOKEN__';
document.head.appendChild(script);
