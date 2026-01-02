window.addEventListener('DOMContentLoaded', () => {
    const prioConfig = { //"className": ["alternate class name", "buttonIcon"]
        "p0": ["🟠", "🌕"], //class .p0 or .🟠 with ico 🌕
        "p1": ["🟡", "🌓"],
        "p2": ["🟢", "🌘"],
        "p3": ["🔵", "🌑"],
        "prio8id": ["🌐"],
        "♥": ["🎈"],
		//"p6":[] //use index instead of ico
    };

    prioControls_init('prioMenu', prioConfig);
    // prio_upd(1); // Set default
});

function prio_upd(val){
	document.body.classList.toggle(`prio${val}`, true);
	prio_inputs[val].checked = true;
};

let prio_inputs = [];
function prioControls_init(settingsPrioID, prioConfig) {
    const container = $(settingsPrioID);

    prio_inputs = Object.keys(prioConfig).map((key, index) => {
        const cfg = prioConfig[key] || [];
		const icon = cfg[1] || cfg[0] || String(index);

        const radio = document.createElement('input');
        Object.assign(radio, {
            type: 'radio',
            name: settingsPrioID,
            id: `${settingsPrioID}${index}`,
            value: index
        });

        const label = document.createElement('label');
        label.htmlFor = radio.id;
        label.textContent = `${icon} ${key}`;
        container.append(radio, label);
        return radio;
    });

    container.addEventListener('change', (e) => { prio_upd(Number(e.target.value)); });
}
