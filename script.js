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

document.querySelector('.contact-link').addEventListener('click', () => {
    gtag('event', 'click', {
        event_category: 'Contact',
        event_label: 'Email Link Clicked',
    });
});

document.querySelector('.download-link').addEventListener('click', () => {
    gtag('event', 'click', {
        event_category: 'Download',
        event_label: 'Download Raw Data Clicked',
    });
});

document.querySelector('.floating-logo-link').addEventListener('click', () => {
    gtag('event', 'click', {
        event_category: 'Navigation',
        event_label: 'Logo Clicked',
        event_value: 1, // Optional, can represent priority or importance
    });
});

document.getElementById('searchButton').addEventListener('click', async function () {
    const county = document.getElementById('county').value.trim().toLowerCase();
    const zip = document.getElementById('zip').value.trim();
    const searchTerm = document.getElementById('search').value.trim().toLowerCase();

    gtag('event', 'search', {
        event_category: 'Search',
        search_term: searchTerm || '(blank)', 
        county: county || '(none)', 
        zip: zip || '(none)', 
    });

    const voters = await fetchVoters();
    console.log(voters);
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

        actionMessageDiv.innerHTML = `First, confirm that you are listed below. If you are, learn how to fight back and make it clear your vote was NOT illegally cast by <a href="https://act.commoncause.org/forms/tell-the-nc-supreme-court-we-matter" target="_blank">filling out this form</a>.`;

        const explanation = document.createElement('div');
        explanation.className = 'explanation';
        resultsDiv.appendChild(explanation);

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headers = ['County', 'Last Name', 'First Name', 'Middle Name', 'Zip', 'Reason'];
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
            console.log(voter);
            const row = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                if (header.toLowerCase() === 'reason') {
                    if (voter.reason == 'i') {
                        td.textContent = '❌';
                        td.title =  'Invalid registration – your voter registration record lacks a verified DMV ID or SSN number (but you showed ID when you voted)';
                    } else if (voter.reason == 'o') {
                        td.textContent = '🌐';
                        td.title = 'No ID from overseas voter – you did not send a copy of a photo ID with your ballot (but overseas voters are exempt from the ID law)';
                    } else if (voter.reason == 'n') {
                        td.textContent = '🚫';
                        td.title = 'Not a NC resident – you live overseas and have never lived in NC (but NC law says family members of a NC citizen living abroad may vote)';
                    } else {
                        td.textContent = '❓';
                        td.title = 'Unknown reason';
                    }
                } else {
                    td.textContent = voter[header.toLowerCase().replace(' ', '')] || '';
                }
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
                gtag('event', 'click', {
                    event_category: 'ShowAll',
                    event_label: 'Show All Clicked',
                });
                e.preventDefault();
                tbody.innerHTML = '';
                filtered.forEach(voter => {
                    const row = document.createElement('tr');
                    headers.forEach(header => {
                        const td = document.createElement('td');
                        if (header.toLowerCase() === 'reason') {
                            if (voter.reason == 'i') {
                                td.textContent = '❌';
                                td.title =  'Invalid registration – your voter registration record lacks a verified DMV ID or SSN number (but you showed ID when you voted)';
                            } else if (voter.reason == 'o') {
                                td.textContent = '🌐';
                                td.title = 'No ID from overseas voter – you did not send a copy of a photo ID with your ballot (but overseas voters are exempt from the ID law)';
                            } else if (voter.reason == 'n') {
                                td.textContent = '🚫';
                                td.title = 'Not a NC resident – you live overseas and have never lived in NC (but NC law says family members of a NC citizen living abroad may vote)';
                            } else {
                                td.textContent = '❓';
                                td.title = 'Unknown reason';
                            }
                        } else {
                            td.textContent = voter[header.toLowerCase().replace(' ', '')] || '';
                        }
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

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.querySelector('.toggle-explanation');
    const chevron = document.querySelector('.chevron');
    const explanationContent = document.querySelector('.explanation-content');
    const collapsibleSection = document.querySelector('.explanation-container');
    const resultsDiv = document.getElementById('results');

    // Show/hide the collapsible section based on search results
    const showCollapsibleSection = () => {
        collapsibleSection.style.display = resultsDiv.innerHTML.trim() ? 'block' : 'none';
    };

    // Update when search results are displayed
    document.getElementById('searchButton').addEventListener('click', () => {
        setTimeout(showCollapsibleSection, 100); // Slight delay to allow results rendering
    });

    // Toggle the chevron and explanation content
    toggleButton.addEventListener('click', () => {
        if (explanationContent.style.display === 'none') {
            explanationContent.style.display = 'block';
            chevron.classList.add('open');
        } else {
            explanationContent.style.display = 'none';
            chevron.classList.remove('open');
        }
    });
});