// data.js
import { data as sourceData } from './data/dataset_1.js';

const BASE_URL = 'https://webinars.webdev.education-services.ru/sp7-api';

let sellers;
let customers;
let lastResult;
let lastQuery;

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
};

const getLocalRecords = (query) => {
    if (!sellers || !customers) buildLocalIndexes();

    let items = sourceData.purchase_records.map(item => ({
        receipt_id: item.receipt_id,
        date: item.date,
        seller_id: item.seller_id,
        customer_id: item.customer_id,
        total_amount: item.total_amount
    }));

    if (query.search) {
        const s = query.search.toLowerCase();
        items = items.filter(item => {
            const date = item.date.toLowerCase();
            const sellerName = sellers[item.seller_id]?.name?.toLowerCase() || '';
            const customerName = customers[item.customer_id]?.name?.toLowerCase() || '';
            return date.includes(s) || sellerName.includes(s) || customerName.includes(s);
        });
    }

    if (query['filter[date]']) {
        items = items.filter(item => item.date.includes(query['filter[date]']));
    }
    if (query['filter[customer]']) {
        const f = query['filter[customer]'].toLowerCase();
        items = items.filter(item => customers[item.customer_id]?.name?.toLowerCase().includes(f));
    }
    if (query['filter[seller]']) {
        const f = query['filter[seller]'].toLowerCase();
        items = items.filter(item => sellers[item.seller_id]?.name?.toLowerCase() === f);
    }
    if (query['filter[totalFrom]']) {
        const min = parseFloat(query['filter[totalFrom]']);
        if (!isNaN(min)) items = items.filter(item => item.total_amount >= min);
    }
    if (query['filter[totalTo]']) {
        const max = parseFloat(query['filter[totalTo]']);
        if (!isNaN(max)) items = items.filter(item => item.total_amount <= max);
    }

    if (query.sort) {
        const [field, order] = query.sort.split(':');
        if (field === 'date' || field === 'total') {
            items.sort((a, b) => {
                let valA = field === 'date' ? a.date : a.total_amount;
                let valB = field === 'date' ? b.date : b.total_amount;
                if (order === 'down') return valA < valB ? 1 : valA > valB ? -1 : 0;
                return valA < valB ? -1 : valA > valB ? 1 : 0;
            });
        }
    }

    const total = items.length;
    const limit = parseInt(query.limit) || 10;
    let page = parseInt(query.page) || 1;
    const maxPage = Math.ceil(total / limit) || 1;
    if (page > maxPage) page = maxPage;
    const start = (page - 1) * limit;
    const itemsSlice = items.slice(start, start + limit);
    const mapped = itemsSlice.map(item => ({
        id: item.receipt_id,
        date: item.date,
        seller: sellers[item.seller_id],
        customer: customers[item.customer_id],
        total: item.total_amount
    }));
    return { total, items: mapped };
};

const getIndexes = async () => {
    if (!sellers || !customers) {
        try {
            [sellers, customers] = await Promise.all([
                fetch(`${BASE_URL}/sellers`).then(res => res.json()),
                fetch(`${BASE_URL}/customers`).then(res => res.json()),
            ]);
        } catch (e) {
            buildLocalIndexes();
        }
    }
    return { sellers, customers };
};

const getRecords = async (query, isUpdated = false) => {
    const qs = new URLSearchParams(query);
    const nextQuery = qs.toString();

    if (lastQuery === nextQuery && !isUpdated) {
        return lastResult;
    }

    try {
        const response = await fetch(`${BASE_URL}/records?${nextQuery}`);
        const records = await response.json();

        lastQuery = nextQuery;
        lastResult = {
            total: records.total,
            items: mapRecords(records.items)
        };
        return lastResult;
    } catch (error) {
        if (!sellers || !customers) buildLocalIndexes();
        return getLocalRecords(query);
    }
};

export function initData() {
    return {
        getIndexes,
        getRecords
    };
}