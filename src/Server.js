import "babel-polyfill";

class Server {
  constructor(host) {
    this.host = host;
  }
  async read() {
    const response = await fetch(this.host);
    const json = await response.json();
    return json;
  }
  async write(state) {
    fetch(this.host, {method: 'post', body: JSON.stringify(state)});
  }
}

export default Server;
