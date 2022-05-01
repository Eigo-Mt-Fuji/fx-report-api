import { Controller, Get, Inject, Res } from '@nestjs/common';
import { Response } from 'express';
import { FxAnalysisService } from './fx-analysis.service';


@Controller('fx-analysis')
export class FxAnalysisController {
    public constructor(private readonly service: FxAnalysisService) {

    }
    @Get()
    public async index(@Res() res: Response)  {
        res.contentType("application/json");
        res.header("X-Total-Count", "1");
        const result = await this.service.findDataAll();
        await this.service.aggregateDatas(result);
        // const data = [
        //     {
        //         id: "hoge",
        //         order_no: "hoge",
        //         date: "2022-01-01 15:15:15",
        //         lot_number: "fuga",
        //         currency: "米ドル円",
        //         buysell: "新規売",
        //         amount: 10,
        //         price: 120.5,
        //         rate: "-",
        //         fee: "-",
        //         swap: 0,
        //         pl: 100,
        //         total_pl: 100,
        //     }
        // ];
        return res.json(result);
    }
}
