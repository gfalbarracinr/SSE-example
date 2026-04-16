let statusStream;

const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    createStatus(formData.get('link'))
}

const createStatus = async (link) => {
    const statusSection = document.getElementById('status-section');
    let statusElement = document.querySelector(`.status[data-link="${link}"]`);

    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.classList.add('status');
        statusElement.dataset.link = link;
        statusElement.innerHTML = `
            <h1 class='status-title'>${link}</h1>
        `;
        statusSection.appendChild(statusElement);
    }

    try {
        createEventListener();
        await createPingRequest(link);
    } catch (error) {
        console.error('Error creating ping request:', error);
    }
}

const createEventListener = () => {
	    if (statusStream) {
	        return statusStream;
	    }

	    statusStream = new EventSource('/ping');
	    statusStream.addEventListener('ping', (event) => {
	        const payload = JSON.parse(event.data);
	        const statusElement = document.querySelector(`.status[data-link="${payload.link}"]`);
	        if (statusElement) {
	            const pingElement = statusElement.querySelector('.ping');
	            if (pingElement) {
	                pingElement.textContent = `${payload.ping.time} ms`;
	                return;
	            }

	            const newPingElement = document.createElement('div');
	            newPingElement.classList.add('ping');
	            newPingElement.textContent = `${payload.ping.time} ms`;
	            statusElement.appendChild(newPingElement);
	        }
	    });

	    return statusStream;
}

const createPingRequest = async (link) => {
	    try {
	        const response = await fetch('/ping', {
	            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ link })
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
    } catch (error) {
        console.error('Error creating ping request:', error);
    }
}
