const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get('message');
if (message) {
  console.log('message: ' + message);
  alert(message);
}
