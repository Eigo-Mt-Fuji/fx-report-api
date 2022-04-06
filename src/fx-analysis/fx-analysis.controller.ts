import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('fx-analysis')
export class FxAnalysisController {


    @Get()
    public index(@Res() res: Response)  {
        res.contentType("application/json");
        res.header("X-Total-Count", "1");

        const data = [
            {
                id: "hoge",
                order_no: "hoge",
                date: "2022-01-01 15:15:15",
                lot_number: "fuga",
                currency: "米ドル円",
                buysell: "新規売",
                amount: 10,
                price: 120.5,
                rate: "-",
                fee: "-",
                swap: 0,
                pl: 100,
                total_pl: 100,
            }
        ];
        return res.json(data);
    }
}
