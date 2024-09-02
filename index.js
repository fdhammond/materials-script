import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createObjectCsvWriter } from 'csv-writer';

const getMaterial = async () => {
    const urls = [
        'https://www.sagosa.com.ar/2665-cemento',
        'https://www.sagosa.com.ar/2723-hierro',
        'https://www.sagosa.com.ar/2646-aridos'
    ];

    let allMaterials = [];

    for (const url of urls) {
        const response = await fetch(url);
        const body = await response.text();
        const $ = cheerio.load(body);
        let getMaterialName = url.split('-').pop();

        if (url.includes('aridos')) {
            getMaterialName = 'bolson'
        }

        $('.product-title').each((index, element) => {
            const title = $(element).text().toLowerCase().trim();
            if (title.includes(getMaterialName)) {
                const price = $('.product-price-and-shipping').eq(index).text().trim();
                allMaterials.push({
                    title,
                    price
                });
            }
        });
    }

    const todayDate = new Date();
    const formattedDate = todayDate.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    const csvWriter = createObjectCsvWriter({
        path: 'materials.csv',
        header: [
            { id: 'Comercio', title: 'Sagosa' },
            { id: 'Fecha', title: formattedDate },
            { id: 'title', title: 'Material' },
            { id: 'price', title: 'Price' }
        ]
    });

    // Add Comercio and Fecha to each record
    const records = allMaterials.map(material => ({
        title: material.title,
        price: material.price
    }));

    await csvWriter.writeRecords(records);

    console.log('CSV file has been written successfully with material data.');
};

getMaterial();
