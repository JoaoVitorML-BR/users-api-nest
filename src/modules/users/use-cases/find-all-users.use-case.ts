import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { UserService } from "../user.service";
import { FindAllUsersResponseDto } from "../dto/find-all-uses-response.dto";
import { PageDto } from "../dto/page.dto";
import { PageMetaDto } from "../dto/page-meta.dto";
import { PageOptionsDto } from "../dto/page-options.dto";

@Injectable()
export class FindAllUsersUseCase {
    constructor(private readonly userService: UserService) { }

    async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<FindAllUsersResponseDto>> {
        const [users, itemCount] = await this.userService.findAll(pageOptionsDto);

        if (!users) {
            throw new InternalServerErrorException('Failed to retrieve users');
        }

        const meta = new PageMetaDto({
            pageOptionsDto,
            itemCount,
        });

        return new PageDto(users, meta);
    }
}