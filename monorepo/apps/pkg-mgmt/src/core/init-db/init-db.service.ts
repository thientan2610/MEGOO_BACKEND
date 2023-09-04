import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Package, PackageDocument } from '../../schemas/package.schema';
import { SoftDeleteModel } from 'mongoose-delete';

@Injectable()
export class InitDbService {
  constructor(
    @InjectModel(Package.name)
    private pkgModel: SoftDeleteModel<PackageDocument>,
  ) {
    this.initPkg();
  }

  async initPkg() {
    console.log('Init package database');
    const count = await this.pkgModel.count();
    if (count == 0) {
      const ExPkg = new this.pkgModel({
        name: 'Gói trải nghiệm',
        duration: 1,
        price: 70000,
        noOfMember: 2,
        editableDuration: false,
        editableNoOfMember: true,
        description:
          'Quản lí Kho\nQuản lí nhu yếu phẩm\nGroup Chat\nQuản lí chi tiêu\nLịch biểu\nTo-do list',
        coefficient: 20000,
      });
      await ExPkg.save();
      const FamiPkg = new this.pkgModel({
        name: 'Gói gia đình',
        duration: 12,
        price: 300000,
        noOfMember: 4,
        editableDuration: false,
        editableNoOfMember: false,
        description:
          'Quản lí Kho\nQuản lí nhu yếu phẩm\nGroup Chat\nQuản lí chi tiêu\nLịch biểu\nTo-do list',
      });
      await FamiPkg.save();
      const AnPkg = new this.pkgModel({
        name: 'Gói thường niên',
        duration: 12,
        price: 357000,
        noOfMember: 2,
        editableDuration: false,
        editableNoOfMember: true,
        description:
          'Quản lí Kho\nQuản lí nhu yếu phẩm\nGroup Chat\nQuản lí chi tiêu\nLịch biểu\nTo-do list',
        coefficient: 20000,
      });
      await AnPkg.save();
      const CustomPkg = new this.pkgModel({
        name: 'Gói tùy chọn',
        duration: 1,
        price: 70000,
        noOfMember: 2,
        editableDuration: true,
        editableNoOfMember: true,
        description:
          'Quản lí Kho\nQuản lí nhu yếu phẩm\nGroup Chat\nQuản lí chi tiêu\nLịch biểu\nTo-do list',
        coefficient: 20000,
      });
      await CustomPkg.save();
    }
  }
}
