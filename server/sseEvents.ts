import ping from 'ping'

export const pingToServer = async (server = 'github.com') => {
    console.log(`Pinging ${server}...`);
    const response = await ping.promise.probe(server);
    return response;
}

