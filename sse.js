const clients = [];

export function setSse(res) {
  clients.push(res);
  console.log(`SSE client added, total clients: ${clients.length}`);
  res.on('close', () => removeSse(res));
}

export function removeSse(res) {
  const index = clients.indexOf(res);
  if (index !== -1) {
    clients.splice(index, 1);
    console.log(`SSE client removed, total clients: ${clients.length}`);
  }
}

export function sendSseNotification(data) {
  clients.forEach((res) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}
