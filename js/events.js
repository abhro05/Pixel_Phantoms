async function loadEvents() {
    const container = document.getElementById("events-container");

    try {
        const res = await fetch("data/events.json");

        if (!res.ok) throw new Error("Failed to load events");

        const events = await res.json();
        container.innerHTML = ""; // Clear loading message

        events.forEach(event => {
            const card = document.createElement("div");
            card.classList.add("event-card");

            card.innerHTML = `
                <h2>${event.title}</h2>
                <p class="event-date"><i class="fa-solid fa-calendar"></i> ${event.date}</p>
                <p class="event-location"><i class="fa-solid fa-location-dot"></i> ${event.location}</p>
                <p class="event-description">${event.description}</p>
                <a href="${event.link}" class="btn-event">Learn More</a>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = `<p class="error-msg">Unable to load events 😢</p>`;
    }
}

loadEvents();
