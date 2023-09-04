import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import { ProductDto } from 'libs/shared/src/lib/dto/prod-mgmt/dto/product.dto';

import * as https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

import { HttpStatus } from '@nestjs/common';
import { ENV_FILE } from '@nyp19vp-be/shared';
import validbarcode from 'barcode-validator';

dotenv.config({
  path: process.env.NODE_ENV !== 'dev' ? process.env.ENV_FILE : ENV_FILE.DEV,
});

interface IProductGoUpcResponseData {
  code: string;
  codeType: string;
  product: {
    name: string;
    description: string;
    region: string;
    imageUrl: string;
    brand: string;
    specs: [string, string][];
    category: string;
    upc: number;
    ean: number;
  };
  barcodeUrl: string;
  inferred: boolean;
}

/**
 * Fetches product data from the Go-UPC API using the provided barcode.
 * @param barcode The barcode to use for the product search.
 * @param retries The number of times to retry the request if it fails.
 * @returns A Promise that resolves to a ProductDto object if the product is found, or null if it is not found.
 */
export const fetchProductDataFromGoUpc = async (
  barcode: string,
  retries = 5,
): Promise<ProductDto> => {
  // check barcode is valid
  if (!validbarcode(barcode)) {
    return null;
  }

  const url = 'https://go-upc.com/api/v1/code/';

  try {
    // bearer token is required
    const response = await axios.get<IProductGoUpcResponseData>(url + barcode, {
      headers: {
        Authorization: `Bearer ${process.env.GO_UPC_API_KEY}`,
      },
      httpsAgent,
    });

    console.log('Response: ', response.data);

    if (response.status !== HttpStatus.OK) {
      return null;
    }

    const productInfo: ProductDto = {
      id: undefined,
      barcode: barcode,
      name: response.data.product.name,
      image: response.data.product.imageUrl,
      brand: response.data.product.brand,
      category: response.data.product.category,
      description: response.data.product.description,
      price: undefined,
      region: response.data.product.region,
      timestamp: undefined,
    };

    return productInfo;
  } catch (error) {
    // console.log('Error: ', error);

    if (
      axios.isAxiosError(error) &&
      error.response?.status === HttpStatus.UNAUTHORIZED
    ) {
      // try to crawl the data from go-upc.com
      return crawlProductInfoWithRetries(barcode, retries);
    } else {
      return null;
    }
  }
};

const crawlProductInfoWithRetries = async (
  barcode: string,
  retries = 2,
): Promise<ProductDto> => {
  if (!validbarcode(barcode)) {
    return null;
  }

  const url = `https://go-upc.com/search?q=${barcode}`;
  try {
    // check barcode is valid

    const response = await axios.get(url, {
      httpsAgent,
    });

    if (response.status !== HttpStatus.OK) {
      return null;
    }

    const html = response.data;
    const $ = cheerio.load(html);

    const productName = $('.product-name').text().trim();
    const productImage = $('.product-image.mobile img').attr('src');
    const ean = $('td:contains("EAN")').next().text().trim();
    const region = ''; // Region is not available in the provided HTML
    const brand = $('td:contains("Brand")').next().text().trim();
    const category = $('td:contains("Category")').next().text().trim();
    const description = $('h2:contains("Description")')
      .next('span')
      .text()
      .trim();

    const productInfo: ProductDto = {
      id: undefined,
      barcode: ean,
      name: productName,
      image: productImage,
      brand: brand,
      category: category,
      description: description,
      price: undefined,
      region: region,
      timestamp: undefined,
    };

    if (!checkValidProductName(productName)) {
      throw new Error('Product error on fetch');
    }

    return productInfo;
  } catch (error) {
    console.log('Error: ', error);

    if (axios.isAxiosError(error)) {
      return null;
    }

    if (retries === 0) {
      return null;
    }

    return crawlProductInfoWithRetries(barcode, retries - 1);
  }
};

const checkValidProductName = (productName: string): boolean => {
  return (
    productName !== '' &&
    productName.toLocaleLowerCase() !== 'product not found' &&
    !productName.toLocaleLowerCase().includes('loading')
  );
};
