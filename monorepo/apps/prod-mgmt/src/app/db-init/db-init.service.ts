import { HttpStatus, Injectable } from '@nestjs/common';
import { GroupEntity } from '../../entities/group.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupProductEntity } from '../../entities/group-product.entity';
import { PurchaseLocationEntity } from '../../entities/purchase-location.entity';
import { StorageLocationEntity } from '../../entities/storage-location.entity';
import { ItemEntity } from '../../entities/item.entity';
import { ProductsService } from '../../products/products.service';
import { GetProductByBarcodeResDto } from 'libs/shared/src/lib/dto/prod-mgmt/products';
import { DistrictService } from '../../divisions/district/district.service';
import { ProvinceService } from '../../divisions/province/province.service';
import { WardService } from '../../divisions/ward/ward.service';
import moment from 'moment';
import { BaseResDto } from '@nyp19vp-be/shared';

@Injectable()
export class DbInitService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,

    @InjectRepository(GroupProductEntity)
    private readonly groupProductRepo: Repository<GroupProductEntity>,

    @InjectRepository(PurchaseLocationEntity)
    private readonly purchaseLocationRepo: Repository<PurchaseLocationEntity>,

    @InjectRepository(StorageLocationEntity)
    private readonly storageLocationRepo: Repository<StorageLocationEntity>,

    @InjectRepository(ItemEntity)
    private readonly itemRepo: Repository<ItemEntity>,

    private readonly productsService: ProductsService,

    private readonly provinceService: ProvinceService,

    private readonly districtService: DistrictService,

    private readonly wardService: WardService,
  ) {}

  async cloneData(groupId: string, addedBy: string): Promise<BaseResDto> {
    console.log('START: Init DB');

    await this.initGroups(groupId);
    await this.initGroupProducts(groupId);
    await this.initStorageLocations(groupId, addedBy);
    await this.initPurchaseLocations(groupId, addedBy);

    // if there is no items, init items
    const items = await this.itemRepo.find({
      where: {
        groupProduct: {
          group: {
            id: groupId,
          },
        },
      },
    });

    if (!items || items.length === 0) {
      await this.initItems(groupId, addedBy);
    }

    console.log('END: Init DB');

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Init DB successfully',
    };
  }

  /**
   * Initializes the groups in the database by creating a new group with the hardcoded group ID if it does not already exist.
   * @returns Promise<void>
   */
  async initGroups(groupId: string) {
    const group = await this.groupRepo.findOneBy({
      id: groupId,
    });
    if (group) {
      return;
    }
    const newGroup = this.groupRepo.create({
      id: groupId,
    });
    await this.groupRepo.save(newGroup);
  }

  private static barcodes = [
    '0667556257076',
    '4037719068317',
    '6224000036911',
    '8592297002451',
    '8809713360027',
    '8934563138165',
    '8934563182144',
    '8934673606820',
    '8935001717676',
    '8935001718314',
    '8935015510454',
    '8935039572049',
    '8935118341146',
    '8936055280031',
    '8936134363631',
    '8936205620410',
    '8938546064779',
    '8992775347256',
    '8996001320051',
  ];

  /**
   * Initializes the group products in the database by creating a new group product for each barcode in the hardcoded barcodes array if it does not already exist.
   * @returns Promise<void>
   */
  private async initGroupProducts(groupId: string) {
    const group = await this.groupRepo.findOneBy({
      id: groupId,
    });

    if (!group) {
      throw new Error(`Group #${groupId} not found`);
    }

    const promises = DbInitService.barcodes.map(async (barcode) => {
      const result: GetProductByBarcodeResDto =
        await this.productsService.getProductByBarcode(barcode);

      if (!result.data) {
        return;
      }

      const productInfo = result.data;

      // create group product base on the product info if the product `barcode` is not in the group
      const isGroupProductWithBarcodeExist = await this.groupProductRepo.exist({
        where: {
          barcode: productInfo.barcode,
          group: {
            id: groupId,
          },
        },
      });

      if (isGroupProductWithBarcodeExist) {
        return;
      }

      const groupProduct = this.groupProductRepo.create({
        ...productInfo,
        group: group,
        id: undefined,
      });

      await this.groupProductRepo.save(groupProduct);
    });

    await Promise.all(promises);
  }

  private static storageLocationNames = {
    vanity_table: 'Bàn trang điểm',
    kitchen_shelf: 'Kệ bếp',
    kitchen_cabinet: 'Tủ bếp',
    fridge: 'Tủ lạnh',
    toilet: 'Nhà vệ sinh',
  };

  private async initStorageLocations(groupId: string, addedBy: string) {
    const group = await this.groupRepo.findOneBy({
      id: groupId,
    });

    if (!group) {
      throw new Error(`Group #${groupId} not found`);
    }

    const promises = Object.values(DbInitService.storageLocationNames).map(
      async (storageLocationName) => {
        const isExistStorageLocation = await this.storageLocationRepo.findOneBy(
          {
            name: storageLocationName,
            group: {
              id: groupId,
            },
          },
        );

        if (isExistStorageLocation) {
          return;
        }

        const storageLocation = this.storageLocationRepo.create({
          name: storageLocationName,
          group: group,
          addedBy: addedBy,
        });

        await this.storageLocationRepo.save(storageLocation);
      },
    );

    await Promise.all(promises);
  }

  private static purchaseLocationNames = {
    bhx: 'Bách hóa xanh',
    co_op: 'Co.opmart',
    aeon: 'Aeon',
    big_c: 'Big C',
    lottemart: 'Lotte Mart',
    vinmart: 'Vinmart',
    circle_k: 'Circle K',
    family_mart: 'Family Mart',
    mini_stop: 'Mini Stop',
    shop_and_go: 'Shop & Go',
    seven_eleven: '7-Eleven',
    guardian: 'Guardian',
    watsons: 'Watsons',
    pharmacity: 'Pharmacity',
    tiki: 'Tiki',
    shopee: 'Shopee',
    lazada: 'Lazada',
    sendo: 'Sendo',
    fahasa: 'Fahasa',
  };

  private async initPurchaseLocations(groupId: string, addedBy: string) {
    const group = await this.groupRepo.findOneBy({
      id: groupId,
    });

    if (!group) {
      throw new Error(`Group #${groupId} not found`);
    }

    const searchText = 'ho chi minh';

    const provinces: {
      code: number;
      name: string;
      division_type: string;
      codename: string;
      phone_code: number;
    }[] = await this.provinceService.search(searchText);

    if (!provinces || provinces.length === 0) {
      throw new Error(`Rrovinces with name ${searchText} not found`);
    }

    const hcmc: {
      code: number;
      name: string;
      division_type: string;
      codename: string;
      phone_code: number;
    } = provinces[0];

    const districts: {
      code: number;
      name: string;
      division_type: string;
      codename: string;
      province_code: number;
    }[] = await this.districtService.search('%', hcmc.code);

    if (!districts || districts.length === 0) {
      throw new Error(`No district belong to ${searchText} not found`);
    }

    const promises = Object.values(DbInitService.purchaseLocationNames).map(
      async (purchaseLocationName) => {
        const isExistPurchaseLocation =
          await this.purchaseLocationRepo.findOneBy({
            name: purchaseLocationName,
            group: {
              id: groupId,
            },
          });

        if (isExistPurchaseLocation) {
          return;
        }

        // random address
        const district =
          districts[Math.floor(Math.random() * districts.length)];

        const wards: {
          code: number;
          name: string;
          division_type: string;
          codename: string;
          district_code: number;
        }[] = await this.wardService.search('%', district.code);

        if (!wards || wards.length === 0) {
          throw new Error(`No ward belong to ${district.name} not found`);
        }

        const ward = wards[Math.floor(Math.random() * wards.length)];

        const purchaseLocation = this.purchaseLocationRepo.create({
          name: purchaseLocationName,
          addedBy: addedBy,
          group: group,
          address: {
            // random number from 1 to 1000
            addressLine1: `${Math.floor(Math.random() * 1000) + 1}`,
            addressLine2: null,
            provinceName: hcmc.name,
            districtName: district.name,
            wardName: ward.name,
          },
        });

        await this.purchaseLocationRepo.save(purchaseLocation);
      },
    );

    await Promise.all(promises);
  }

  private static items_x_storageLocations = {
    '0667556257076': [DbInitService.storageLocationNames.vanity_table],
    '4037719068317': [DbInitService.storageLocationNames.fridge],
    '6224000036911': [
      DbInitService.storageLocationNames.kitchen_shelf,
      DbInitService.storageLocationNames.fridge,
    ],
    '8592297002451': [
      DbInitService.storageLocationNames.vanity_table,
      DbInitService.storageLocationNames.toilet,
    ],
    '8809713360027': [
      DbInitService.storageLocationNames.vanity_table,
      DbInitService.storageLocationNames.toilet,
    ],
    '8934563138165': [
      DbInitService.storageLocationNames.kitchen_shelf,
      DbInitService.storageLocationNames.kitchen_cabinet,
    ],
    '8934563182144': [
      DbInitService.storageLocationNames.kitchen_shelf,
      DbInitService.storageLocationNames.kitchen_cabinet,
    ],
    '8934673606820': [DbInitService.storageLocationNames.fridge],
    '8935001717676': [
      DbInitService.storageLocationNames.kitchen_shelf,
      DbInitService.storageLocationNames.kitchen_cabinet,
      DbInitService.storageLocationNames.fridge,
    ],
    '8935001718314': [
      DbInitService.storageLocationNames.kitchen_shelf,
      DbInitService.storageLocationNames.kitchen_cabinet,
    ],
    '8935015510454': [
      DbInitService.storageLocationNames.kitchen_shelf,
      DbInitService.storageLocationNames.kitchen_cabinet,
    ],
    '8935039572049': [
      DbInitService.storageLocationNames.kitchen_shelf,
      DbInitService.storageLocationNames.kitchen_cabinet,
    ],
    '8935118341146': [
      DbInitService.storageLocationNames.kitchen_shelf,
      DbInitService.storageLocationNames.kitchen_cabinet,
      DbInitService.storageLocationNames.fridge,
    ],
    '8936055280031': [
      DbInitService.storageLocationNames.kitchen_shelf,
      DbInitService.storageLocationNames.kitchen_cabinet,
    ],
    '8936134363631': [
      DbInitService.storageLocationNames.kitchen_shelf,
      DbInitService.storageLocationNames.kitchen_cabinet,
      DbInitService.storageLocationNames.fridge,
    ],
    '8936205620410': [
      DbInitService.storageLocationNames.toilet,
      DbInitService.storageLocationNames.vanity_table,
    ],
    '8938546064779': [DbInitService.storageLocationNames.vanity_table],
    '8992775347256': [DbInitService.storageLocationNames.kitchen_shelf],
    '8996001320051': [DbInitService.storageLocationNames.kitchen_cabinet],
  };

  private async initItems(groupId: string, addedBy: string) {
    const group = await this.groupRepo.findOneBy({
      id: groupId,
    });

    if (!group) {
      throw new Error(`Group #${groupId} not found`);
    }

    // get all purchase locations
    const purchaseLocations = await this.purchaseLocationRepo.find({
      where: {
        group: {
          id: groupId,
        },
      },
    });

    if (!purchaseLocations || purchaseLocations.length === 0) {
      throw new Error(`No purchase location found`);
    }

    const promises = Object.entries(DbInitService.items_x_storageLocations).map(
      async ([barcode, storageLocationNames]) => {
        const groupProduct = await this.groupProductRepo.findOneBy({
          barcode: barcode,
          group: {
            id: groupId,
          },
        });

        if (!groupProduct) {
          throw new Error(`Group product with barcode ${barcode} not found`);
        }

        // random purchase location
        const purchaseLocation =
          purchaseLocations[
            Math.floor(Math.random() * purchaseLocations.length)
          ];

        // random storage location
        const storageLocationName =
          storageLocationNames[
            Math.floor(Math.random() * storageLocationNames.length)
          ];

        const storageLocation = await this.storageLocationRepo.findOneBy({
          name: storageLocationName,
          group: {
            id: groupId,
          },
        });

        if (!storageLocation) {
          throw new Error(
            `Storage location with name ${storageLocationName} not found`,
          );
        }

        // check if item with the same group product and storage location and purchase location already exist
        const isExistItem = await this.itemRepo.exist({
          where: {
            groupProduct: {
              id: groupProduct.id,
            },
            storageLocation: {
              id: storageLocation.id,
            },
            purchaseLocation: {
              id: purchaseLocation.id,
            },
          },
        });

        if (isExistItem) {
          return;
        }

        // create item
        const item = this.itemRepo.create({
          groupProduct: groupProduct,
          storageLocation: storageLocation,
          purchaseLocation: purchaseLocation,
          unit: 'unit',
          addedBy: addedBy,
          bestBefore: moment().add(1, 'year').toDate(),
          image: groupProduct.image,

          // random number from 1 to 5
          quantity: Math.floor(Math.random() * 5) + 1,
        });

        await this.itemRepo.save(item);
      },
    );

    await Promise.all(promises);
  }
}
