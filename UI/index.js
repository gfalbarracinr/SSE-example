let statusStream;

const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const link = formData.get('link');
    form.reset(); 
    createStatus(link)
}

const createStatus = async (link) => {
    const url = new URL(link);
    const statusSection = document.getElementById('status-section');
    let statusElement = document.querySelector(`.status[data-link="${link}"]`);

    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.classList.add('status');
        statusElement.dataset.link = link;
        statusElement.innerHTML = `
            <h1 class='status-title'>${url.hostname}</h1>
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

const createEventStatus = (status) => {
    const icon = document.createElement('i')
    icon.classList.add('status-icon', status);
    return icon;
}

const createTimeText = (time) => {
    const timeElement = document.createElement('p');
    timeElement.classList.add('ping-time');
    timeElement.textContent = `${time} ms`;
    return timeElement;
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
                const statusClass = payload.ping.alive ? 'alive' : 'dead';
	            const pingElement = statusElement.querySelector('.ping');
	            if (pingElement) {
                    const childicon = pingElement.querySelectorAll('.status-icon');
                    childicon.forEach(toRemove => toRemove.remove());
                    pingElement.appendChild(createEventStatus(statusClass));
                    if (statusClass === 'alive') {
	                   const timeElement = pingElement.querySelectorAll('.ping-time');
                       timeElement.forEach(toRemove => toRemove.remove());
                       pingElement.appendChild(createTimeText(payload.ping.time));
                    }
	                return;
	            }
	            const newPingElement = document.createElement('div');
                newPingElement.classList.add('ping');
	            newPingElement.appendChild(createEventStatus(statusClass));
                if (statusClass === 'alive') {
                    newPingElement.appendChild(createTimeText(payload.ping.time));
                }
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
