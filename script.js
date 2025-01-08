async function fetchVoters() {
    const response = await fetch('voters.csv');
    const text = await response.text();

    const rows = text.split('\n').map(row => row.split(','));
    const headers = rows.shift(); // Remove headers
    return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header.trim().toLowerCase()] = row[index]?.trim();
        });
        return obj;
    });
}

function parseSearchTerm(searchTerm) {
    const words = searchTerm.trim().split(/\s+/);
    const nameParts = { firstname: '', middlename: '', lastname: '' };

    if (words.length === 1) {
        nameParts.lastname = words[0].toLowerCase();
    } else if (words.length === 2) {
        nameParts.firstname = words[0].toLowerCase();
        nameParts.lastname = words[1].toLowerCase();
    } else if (words.length > 2) {
        nameParts.firstname = words[0].toLowerCase();
        nameParts.lastname = words[words.length - 1].toLowerCase();
        nameParts.middlename = words.slice(1, -1).join(' ').toLowerCase();
    }

    return nameParts;
}

function enableSearchButton() {
    const searchInput = document.getElementById('search').value.trim();
    const countyInput = document.getElementById('county').value.trim();
    const zipInput = document.getElementById('zip').value.trim();

    const searchButton = document.getElementById('searchButton');
    searchButton.disabled = !(searchInput || countyInput || zipInput);
}

document.getElementById('search').addEventListener('input', enableSearchButton);

document.getElementById('county').addEventListener('change', enableSearchButton);

document.getElementById('zip').addEventListener('input', enableSearchButton);

document.getElementById('search').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('searchButton').click();
    }
});


document.getElementById('searchButton').addEventListener('click', async function () {
    const county = document.getElementById('county').value.trim().toLowerCase();
    const zip = document.getElementById('zip').value.trim();
    const searchTerm = document.getElementById('search').value.trim().toLowerCase();

    const voters = await fetchVoters();
    const nameParts = parseSearchTerm(searchTerm);

    const filtered = voters.filter(voter => {
        const lastname = voter.lastname ? voter.lastname.toLowerCase() : '';
        const firstname = voter.firstname ? voter.firstname.toLowerCase() : '';
        const middlename = voter.middlename ? voter.middlename.toLowerCase() : '';

        const matchesName = searchTerm === '' || (
            lastname.includes(nameParts.lastname) &&
            firstname.includes(nameParts.firstname) &&
            middlename.includes(nameParts.middlename)
        );

        voterCounty = voter.county ? voter.county.toLowerCase() : '';
        const matchesCounty = county === '' || voterCounty === county;
        const matchesZip = zip === '' || voter.zip === zip;

        return matchesName && matchesCounty && matchesZip;
    });

    const resultsDiv = document.getElementById('results');
    const responseDiv = document.getElementById('response');
    const actionMessageDiv = document.getElementById('action-message');

    resultsDiv.innerHTML = '';
    responseDiv.innerHTML = '';
    actionMessageDiv.innerHTML = '';

    if (filtered.length > 0) {
        responseDiv.textContent = 'YES';
        responseDiv.className = 'yes';

        actionMessageDiv.innerHTML = `To fight back, make it clear your vote was NOT illegally cast by filling out this form <a href="https://act.commoncause.org/forms/tell-the-nc-supreme-court-we-matter" target="_blank">HERE</a>.`;

        const explanation = document.createElement('div');
        explanation.className = 'explanation';
        explanation.textContent = 'Judge Griffin has challenged the legality of the votes cast by the following people matching your search criteria:';
        resultsDiv.appendChild(explanation);

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headers = ['County', 'Last Name', 'First Name', 'Middle Name', 'Zip'];
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        let showAllLink;
        const rowsToShow = 10;
        filtered.slice(0, rowsToShow).forEach(voter => {
            const row = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = voter[header.toLowerCase().replace(' ', '')] || '';
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        if (filtered.length > rowsToShow) {
            showAllLink = document.createElement('a');
            showAllLink.textContent = 'Show All';
            showAllLink.className = 'show-all-link';
            showAllLink.href = '#';

            showAllLink.addEventListener('click', function (e) {
                e.preventDefault();
                tbody.innerHTML = '';
                filtered.forEach(voter => {
                    const row = document.createElement('tr');
                    headers.forEach(header => {
                        const td = document.createElement('td');
                        td.textContent = voter[header.toLowerCase().replace(' ', '')] || '';
                        row.appendChild(td);
                    });
                    tbody.appendChild(row);
                });
                showAllLink.remove();
            });
        }

        table.appendChild(tbody);
        resultsDiv.appendChild(table);

        if (showAllLink) {
            resultsDiv.appendChild(showAllLink);
        }
    } else {
        responseDiv.textContent = 'NO';
        responseDiv.className = 'no';
    }
});
