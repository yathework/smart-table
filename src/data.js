// data.js
const BASE_URL = 'https://webinars.webdev.education-services.ru/sp7-api';
const CHECK_TIMEOUT = 500;

export function initData(sourceData) {
    let sellers;
    let customers;
    let lastResult;
    let lastQuery;
    let useLocalFallback = false;
    let serverChecked = false;

    const fetchWithTimeout = (url, timeout = CHECK_TIMEOUT) => {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), timeout)
            )
        ]);
    };

    const mapRecords = (data) => data.map(item => ({
        id: item.receipt_id,
        date: item.date,
        seller: sellers[item.seller_id],
        customer: customers[item.customer_id],
        total: item.total_amount
    }));

    const buildLocalIndexes = () => {
        sellers = sourceData.sellers.reduce((acc, s) => {
            acc[s.id] = { id: s.id, name: `${s.first_name} ${s.last_name}` };
            return acc;
        }, {});
        customers = sourceData.customers.reduce((acc, c) => {
            acc[c.id] = { id: c.id, name: `${c.first_name} ${c.last_name}` };
            return acc;
        }, {});
        return { sellers, customers };
    };

    const checkServer = async () => {
        if (serverChecked) return;
        serverChecked = true;
        try {
            await fetchWithTimeout(`${BASE_URL}/sellers`, CHECK_TIMEOUT);
        } catch (e) {
            useLocalFallback = true;
            buildLocalIndexes();
        }
    };

    const getIndexes = async () => {
        if (!serverChecked) {
            await checkServer();
        }
        if (useLocalFallback) {
            return { sellers, customers };
        }
        if (!sellers || !customers) {
            try {
                const [sellersData, customersData] = await Promise.all([
                    fetchWithTimeout(`${BASE_URL}/sellers`).then(res => res.json()),
                    fetchWithTimeout(`${BASE_URL}/customers`).then(res => res.json()),
                ]);
                sellers = sellersData;
                customers = customersData;
            } catch (e) {
                useLocalFallback = true;
                return buildLocalIndexes();
            }
        }
        return { sellers, customers };
    };

    const getRecords = async (query, isUpdated = false) => {
        if (!serverChecked) {
            await checkServer();
        }
        if (useLocalFallback) {
            const allItems = sourceData.purchase_records.map(item => ({
                receipt_id: item.receipt_id,
                date: item.date,
                seller_id: item.seller_id,
                customer_id: item.customer_id,
                total_amount: item.total_amount
            }));
            const limit = parseInt(query.limit) || 10;
            const page = parseInt(query.page) || 1;
            const start = (page - 1) * limit;
            const itemsSlice = allItems.slice(start, start + limit);
            const mapped = itemsSlice.map(item => ({
                id: item.receipt_id,
                date: item.date,
                seller: sellers[item.seller_id],
                customer: customers[item.customer_id],
                total: item.total_amount
            }));
            return {
                total: allItems.length,
                items: mapped
            };
        }

        const qs = new URLSearchParams(query);
        const nextQuery = qs.toString();

        if (lastQuery === nextQuery && !isUpdated) {
            return lastResult;
        }

        try {
            const response = await fetchWithTimeout(`${BASE_URL}/records?${nextQuery}`);
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            const records = await response.json();

            lastQuery = nextQuery;
            lastResult = {
                total: records.total,
                items: mapRecords(records.items)
            };
            return lastResult;
        } catch (error) {
            useLocalFallback = true;
            if (!sellers || !customers) {
                buildLocalIndexes();
            }
            return getRecords(query, isUpdated);
        }
    };

    return { getIndexes, getRecords, checkServer };
}