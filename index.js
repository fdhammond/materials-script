import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';

// Configuration for URLs and material names
const MATERIALS_CONFIG = [
    { shop: 'Sagosa', url: 'https://www.sagosa.com.ar/2665-cemento', materialName: 'cemento' },
    { shop: 'Sagosa', url: 'https://www.sagosa.com.ar/2723-hierro', materialName: 'hierro' },
    { shop: 'Sagosa', url: 'https://www.sagosa.com.ar/2646-aridos', materialName: 'bolson' },
    { shop: 'Sagosa', url: 'https://www.sagosa.com.ar/2755-malla', materialName: 'malla' },
    { shop: 'Mottesi', url: 'https://mottesimateriales.com.ar/construccion/hierro', materialName: 'hierro' },
    { shop: 'Mottesi', url: 'https://mottesimateriales.com.ar/construccion/mallas/', materialName: 'malla' },
];

// Utility to format the date
const getFormattedDate = () => {
    const todayDate = new Date();
    return todayDate.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

// Fetch HTML from the URL
const fetchHtml = async (url) => {
    try {
        const response = await fetch(url);
        return await response.text();
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return null;
    }
};

// Extract material data based on the structure of the website
const extractMaterials = ($, materialName, shop) => {
    const materialData = [];

    $('.product-title, .item-name').each((index, element) => {
        const title = $(element).text().toLowerCase().trim();
        if (title.includes(materialName)) {
            const price = $('.price, .item-price').eq(index).text().trim();
            const discount = $('.discount-percentage.discount-product').eq(index).text().trim();
            const noStockLabel = $('.label.label-default, #product-availability-grid').eq(index).text().trim();
            const noStock = noStockLabel.includes('Sin stock') || noStockLabel.includes('Fuera de stock');

            materialData.push({
                shop,
                material: materialName,
                title,
                price,
                discount: discount || '',
                stock: noStock ? 'Sin stock' : ''
            });
        }
    });

    return materialData;
};

// Write data to JSON file
const writeToJson = async (data, filePath) => {
    const jsonData = JSON.stringify(data, null, 2);
    try {
        await fs.writeFileSync(filePath, jsonData);
    } catch (error) {
        console.error(`Error writing JSON file:`, error);
    }
};

// Write data to CSV file
const writeToCsv = async (records, filePath) => {
    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            { id: 'shop', title: 'Shop' },
            { id: 'date', title: 'Date' },
            { id: 'material', title: 'Material' },
            { id: 'title', title: 'Title' },
            { id: 'price', title: 'Price' },
            { id: 'discount', title: 'Discount' },
            { id: 'stock', title: 'Stock' },
        ]
    });

    try {
        await csvWriter.writeRecords(records);
    } catch (error) {
        console.error(`Error writing CSV file:`, error);
    }
};

// Main function to fetch materials and write to files
const getMaterial = async () => {
    const allMaterials = {};
    const records = [];
    const formattedDate = getFormattedDate();

    for (const { shop, url, materialName } of MATERIALS_CONFIG) {
        const html = await fetchHtml(url);
        if (html) {
            const $ = cheerio.load(html);
            const materials = extractMaterials($, materialName, shop);

            // Group materials by shop
            if (!allMaterials[shop]) {
                allMaterials[shop] = [];
            }
            allMaterials[shop].push(...materials);

            // Add date and flatten for CSV records
            materials.forEach(material => {
                records.push({ ...material, date: formattedDate });
            });
        }
    }

    // Write to files
    await writeToJson(allMaterials, 'materials.json');
    await writeToCsv(records, 'materials.csv');
    console.log(`CSV and JSON file have been written successfully`);
};

getMaterial();
