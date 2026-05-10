const API_URL = 'http://localhost:5000/api';

async function runTests() {
    let touristToken, hostToken, adminToken;
    let listingId, requestId;

    console.log('--- Phase 1: Authentication ---');
    try {
        let ts = Date.now();
        // 1. Register Tourist
        let res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Tourist', email: `test_tourist_${ts}@test.com`, password: 'password123', role: 'tourist' })
        });
        let data = await res.json();
        if (res.status !== 201) throw new Error(`Tourist Register failed: ${res.status} ${JSON.stringify(data)}`);
        console.log('Tourist Register: 201 OK');
        touristToken = data.token;

        // 2. Register Host
        res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Host', email: `test_host_${ts}@test.com`, password: 'password123', role: 'host' })
        });
        data = await res.json();
        if (res.status !== 201) throw new Error(`Host Register failed: ${res.status} ${JSON.stringify(data)}`);
        console.log('Host Register: 201 OK');
        hostToken = data.token;

        // 3. Login Admin
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@naryn.com', password: 'password123' })
        });
        data = await res.json();
        if (res.status !== 200) throw new Error(`Admin Login failed: ${res.status} ${JSON.stringify(data)}`);
        console.log('Admin Login: 200 OK');
        adminToken = data.token;

    } catch (e) { 
        console.error('Phase 1 Error:', e.message);
        return;
    }

    console.log('\n--- Phase 2: Host Operations ---');
    try {
        // 1. Update Business Profile
        let res = await fetch(`${API_URL}/hosts/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': hostToken },
            body: JSON.stringify({ businessName: 'Test Business', businessDescription: 'Test Desc' })
        });
        let data = await res.json();
        console.log('Update Host Profile:', res.status, data.msg === 'Profile updated' ? 'OK' : `FAIL (${data.msg})`);

        // 2. Create Listing
        res = await fetch(`${API_URL}/listings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': hostToken },
            body: JSON.stringify({
                title: 'Test Listing',
                category: 'guesthouse',
                price: 100,
                location: 'Naryn',
                description: 'Test Description',
                images: ['image1.jpg'],
                videos: ['video1.mp4'],
                amenities: ['WiFi']
            })
        });
        data = await res.json();
        if (res.status !== 201) throw new Error(`Create Listing failed: ${res.status} ${JSON.stringify(data)}`);
        console.log('Create Listing: 201 OK');
        listingId = data.id;

        // 3. Create Content Request
        res = await fetch(`${API_URL}/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': hostToken },
            body: JSON.stringify({
                listingId: listingId,
                type: 'images',
                images: ['new_image.jpg']
            })
        });
        data = await res.json();
        if (res.status !== 201) throw new Error(`Create Content Request failed: ${res.status} ${JSON.stringify(data)}`);
        console.log('Create Content Request: 201 OK');
        requestId = data.id;

    } catch (e) { 
        console.error('Phase 2 Error:', e.message);
        return;
    }

    console.log('\n--- Phase 3: Admin Operations ---');
    try {
        // 1. Get Pending Listings
        let res = await fetch(`${API_URL}/listings?status=pending`);
        let data = await res.json();
        const foundListing = data.some(l => l.id === listingId);
        console.log('Admin Get Pending Listings:', res.status, foundListing ? 'OK' : 'FAIL');

        // 2. Approve Listing
        res = await fetch(`${API_URL}/listings/${listingId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': adminToken },
            body: JSON.stringify({ status: 'approved' })
        });
        data = await res.json();
        console.log('Admin Approve Listing:', res.status, data.msg === 'Listing approved successfully' ? 'OK' : `FAIL (${data.msg})`);

        // 3. Approve Request
        res = await fetch(`${API_URL}/requests/${requestId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': adminToken },
            body: JSON.stringify({ status: 'approved' })
        });
        data = await res.json();
        console.log('Admin Approve Request:', res.status, data.msg === 'Request approved and listing updated' ? 'OK' : `FAIL (${data.msg})`);
        
    } catch (e) { 
        console.error('Phase 3 Error:', e.message);
        return;
    }

    console.log('\n--- Phase 4: Tourist Operations ---');
    try {
        // 1. Get Approved Listings
        let res = await fetch(`${API_URL}/listings`);
        let data = await res.json();
        const foundListing = data.some(l => l.id === listingId);
        console.log('Get Approved Listings:', res.status, foundListing ? 'OK' : 'FAIL');

        // 2. Get Listing Details
        res = await fetch(`${API_URL}/listings/${listingId}`);
        data = await res.json();
        console.log('Get Listing Details:', res.status, data.id === listingId ? 'OK' : 'FAIL');

        // Verify request content was added
        const imagesParsed = data.images;
        console.log('Verified Content Request Added:', imagesParsed.includes('new_image.jpg') ? 'OK' : 'FAIL');

        // 3. Book Listing
        res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': touristToken },
            body: JSON.stringify({
                listingId: listingId,
                date: '2026-12-01',
                totalPrice: 100
            })
        });
        data = await res.json();
        console.log('Tourist Booking:', res.status, res.status === 201 ? 'OK' : `FAIL (${res.status})`);

    } catch (e) { 
        console.error('Phase 4 Error:', e.message);
    }
}

runTests();
