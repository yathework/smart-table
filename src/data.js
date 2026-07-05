const BASE_URL = 'https://webinars.webdev.education-services.ru/sp7-api';

export function initData(sourceData) {
    let sellers;
    let customers;
    let lastResult;
    let lastQuery;
    let useLocalFallback = false;

    const prepareLocalIndexes = () => {
        const sellersIndex = sourceData.sellers.reduce((acc, s) => {
            acc[s.id] = { id: s.id, name: `${s.first_name} ${s.last_name}` };
            return acc;
        }, {});
        const customersIndex = sourceData.customers.reduce((acc, c) => {
            acc[c.id] = { id: c.id, name: `${c.first_name} ${c.last_name}` };
            return acc;
        }, {});
        return { sellers: sellersIndex, customers: customersIndex };
    };

    const mapRecords = (data) => data.map(item => ({
        id: item.receipt_id,
        date: item.date,
        seller: sellers[item.seller_id],
        customer: customers[item.customer_id],
        total: item.total_amount
    }));

    const getIndexes = async () => {
        if (useLocalFallback) {
            return prepareLocalIndexes();
        }

        if (!sellers || !customers) {
            try {
                const [sellersRes, customersRes] = await Promise.all([
                    fetch(`${BASE_URL}/sellers`).then(res => res.json()),
                    fetch(`${BASE_URL}/customers`).then(res => res.json()),
                ]);

                sellers = Object.entries(sellersRes).reduce((acc, [id, name]) => {
                    acc[id] = { id, name };
                    return acc;
                }, {});
                customers = Object.entries(customersRes).reduce((acc, [id, name]) => {
                    acc[id] = { id, name };
                    return acc;
                }, {});
            } catch (e) {
                console.warn('Сервер недоступен, переключаемся на локальные данные');
                useLocalFallback = true;
                return prepareLocalIndexes();
            }
        }
        return { sellers, customers };
    };

    const getRecords = async (query, isUpdated = false) => {
        if (useLocalFallback) {
            let items = sourceData.purchase_records.map(item => ({
                receipt_id: item.receipt_id,
                date: item.date,
                seller_id: item.seller_id,
                customer_id: item.customer_id,
                total_amount: item.total_amount
            }));

            const limit = parseInt(query.limit) || 10;
            const page = parseInt(query.page) || 1;
            const start = (page - 1) * limit;
            const end = start + limit;
            const total = items.length;
            items = items.slice(start, end);

            const { sellers: sIdx, customers: cIdx } = await getIndexes();
            const mapped = items.map(item => ({
                id: item.receipt_id,
                date: item.date,
                seller: sIdx[item.seller_id],
                customer: cIdx[item.customer_id],
                total: item.total_amount
            }));

            return { total, items: mapped };
        }

        const qs = new URLSearchParams(query);
        const nextQuery = qs.toString();

        if (lastQuery === nextQuery && !isUpdated) {
            return lastResult;
        }

        try {
            const response = await fetch(`${BASE_URL}/records?${nextQuery}`);
            const recordsData = await response.json();
            const records = recordsData.items || [];

            lastQuery = nextQuery;
            lastResult = {
                total: recordsData.total ?? records.length,
                items: mapRecords(records)
            };
            return lastResult;
        } catch (e) {
            console.warn('Ошибка при получении записей с сервера, переключаемся на локальные данные');
            useLocalFallback = true;
            return getRecords(query, isUpdated);
        }
    };

    return { getIndexes, getRecords };
}