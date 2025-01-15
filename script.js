async function fetchVoters() {
    try {
        const response = await fetch('voters.csv');
        if (!response.ok) throw new Error('Network response was not ok');
        const text = await response.text();

        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows.shift(); // Remove headers
        return rows.filter(row => row.length > 1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header.trim().toLowerCase()] = row[index]?.trim();
            });
            return obj;
        });
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

function parseSearchTerm(searchTerm) {
    const nameParts = { firstname: '', middlename: '', lastname: '' };

    if (searchTerm.includes(',')) {
        const parts = searchTerm.split(',').map(part => part.trim().toLowerCase());
        nameParts.lastname = parts[0];
        if (parts.length > 1) {
            const firstAndMiddle = parts[1].split(/\s+/);
            nameParts.firstname = firstAndMiddle[0];
            if (firstAndMiddle.length > 1) {
                nameParts.middlename = firstAndMiddle.slice(1).join(' ');
            }
        }
    } else {
        const words = searchTerm.trim().split(/\s+/).map(word => word.toLowerCase());
        if (words.length === 1) {
            nameParts.lastname = words[0];
        } else if (words.length === 2) {
            nameParts.firstname = words[0];
            nameParts.lastname = words[1];
        } else if (words.length === 3) {
            nameParts.lastname = words[0];
            nameParts.firstname = words[1];
            nameParts.middlename = words[2];
        } else if (words.length > 3) {
            nameParts.firstname = words[0];
            nameParts.lastname = words[words.length - 1];
            nameParts.middlename = words.slice(1, -1).join(' ');
        }
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

document.querySelector('.contact-link')?.addEventListener('click', () => {
    gtag('event', 'click', {
        event_category: 'Contact',
        event_label: 'Email Link Clicked',
    });
});

document.querySelector('.download-link')?.addEventListener('click', () => {
    gtag('event', 'click', {
        event_category: 'Download',
        event_label: 'Download Raw Data Clicked',
    });
});

document.querySelector('.floating-logo-link')?.addEventListener('click', () => {
    gtag('event', 'click', {
        event_category: 'Navigation',
        event_label: 'Logo Clicked',
        event_value: 1, // Optional, can represent priority or importance
    });
});

function sortResults(results, searchTerm) {
    const nameParts = parseSearchTerm(searchTerm);
    return results.sort((a, b) => {
        const aLastName = a.lastname ? a.lastname.toLowerCase() : '';
        const bLastName = b.lastname ? b.lastname.toLowerCase() : '';
        const aFirstName = a.firstname ? a.firstname.toLowerCase() : '';
        const bFirstName = b.firstname ? b.firstname.toLowerCase() : '';
        const exactMatchA = aLastName === nameParts.lastname;
        const exactMatchB = bLastName === nameParts.lastname;

        if (exactMatchA && !exactMatchB) return -1;
        if (!exactMatchA && exactMatchB) return 1;

        if (exactMatchA && exactMatchB && nameParts.firstname) {
            const exactFirstNameMatchA = aFirstName === nameParts.firstname;
            const exactFirstNameMatchB = bFirstName === nameParts.firstname;

            if (exactFirstNameMatchA && !exactFirstNameMatchB) return -1;
            if (!exactFirstNameMatchA && exactFirstNameMatchB) return 1;
        }

        const aZip = a.zip ? a.zip : '';
        const bZip = b.zip ? b.zip : '';
        if (aZip < bZip) return -1;
        if (aZip > bZip) return 1;

        return 0;
    });
}

function createTableRow(voter, headers) {
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
        } else if (header.toLowerCase() === 'name') {
            td.textContent = `${voter.lastname || ''}, ${voter.firstname || ''} ${voter.middlename || ''}`.trim();
        } else {
            td.textContent = voter[header.toLowerCase().replace(' ', '')] || '';
        }
        if (header.toLowerCase() === 'zip') {
            td.classList.add('hide-on-small-screen');
        }
        row.appendChild(td);
    });
    return row;
}

function displayResults(filteredResults, searchTerm) {
    const sortedResults = sortResults(filteredResults, searchTerm);
    const resultsDiv = document.getElementById('results');
    const responseDiv = document.getElementById('response');
    const actionMessageDiv = document.getElementById('action-message');

    resultsDiv.innerHTML = '';
    responseDiv.innerHTML = '';
    actionMessageDiv.innerHTML = '';

    if (sortedResults.length > 0) {
        responseDiv.textContent = 'YES';
        responseDiv.className = 'yes';

        actionMessageDiv.innerHTML = `This table displays voters whose ballots are being challenged. Confirm that you are listed below. If you are, fight back and make it clear your vote is NOT illegally cast by <a href="https://act.commoncause.org/forms/tell-the-nc-supreme-court-we-matter" target="_blank">filling out this form</a>.`;

        const explanation = document.createElement('div');
        explanation.className = 'explanation';
        resultsDiv.appendChild(explanation);

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headers = ['County', 'Name', 'Zip', 'Reason'];
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            if (header.toLowerCase() === 'zip') {
                th.classList.add('hide-on-small-screen');
            }
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        let showAllLink;
        const rowsToShow = 10;
        sortedResults.slice(0, rowsToShow).forEach(voter => {
            const row = createTableRow(voter, headers);
            tbody.appendChild(row);
        });

        if (sortedResults.length > rowsToShow) {
            showAllLink = document.createElement('a');
            showAllLink.textContent = `10 of ${sortedResults.length} displayed. Show All`;
            showAllLink.className = 'show-all-link';
            showAllLink.href = '#';

            showAllLink.addEventListener('click', function (e) {
                gtag('event', 'click', {
                    event_category: 'ShowAll',
                    event_label: 'Show All Clicked',
                });
                e.preventDefault();
                tbody.innerHTML = '';
                sortedResults.forEach(voter => {
                    const row = createTableRow(voter, headers);
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
}

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

        const voterCounty = voter.county ? voter.county.toLowerCase() : '';
        const matchesCounty = county === '' || voterCounty === county;
        const matchesZip = zip === '' || voter.zip === zip;

        return matchesName && matchesCounty && matchesZip;
    });

    displayResults(filtered, searchTerm);
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