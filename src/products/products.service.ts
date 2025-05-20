import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';
import { PaginationDto } from '../common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  async create(createProductDto: CreateProductDto) {
    return await this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 1, page = 10 } = paginationDto;

    const totalPages = await this.product.count();
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          available: true,
        },
      }),
      meta: {
        page,
        lastPage,
        total: totalPages,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: {
        id,
        available: true,
      },
    });
    if (!product) {
      throw new RpcException({
        message: `Product with id: ${id} not found`,
        status: HttpStatus.BAD_REQUEST,
      });
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: __, ...data } = updateProductDto;

    const productFound = await this.findOne(id);
    if (!productFound) {
      throw new NotFoundException(`Product with id: ${id} not found`);
    }
    return await this.product.update({
      where: {
        id,
      },
      data: data,
    });
  }

  async remove(id: number) {
    const productFound = await this.findOne(id);
    if (!productFound) {
      throw new NotFoundException(`Product with id: ${id} not found`);
    }
    // return await this.product.delete({
    //   where: {
    //     id,
    //   },
    // });
    const product = await this.product.update({
      where: { id },
      data: {
        available: false,
      },
    });

    return product;
  }
}
