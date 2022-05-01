import { Injectable } from '@nestjs/common';
// import AWS, { AWSError } from 'aws-sdk';
import {S3, S3ServiceException} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class FxAnalysisService {

    async findDataAll() {
        const client = new S3({region: 'ap-northeast-1'});
        const response = await client.listObjectsV2({
            Bucket: process.env.NESTJS_DATA_S3_BUCKET,
            Prefix: 'src/data/fx_transactions/'
        });
        return response.Contents.map( (value) =>{

            return value.Key;
        });
    }
    async aggregateDatas(contents: string[]) {

        return await Promise.all(contents.map( async (key) => {
            
            const value: any[] = await this.findDataByKey(key);
            // ヘッダ削除
            value.shift();

//TODO: 分析用にデータを加工する処理を実装
// 元データ - (新規建玉注文あたりの決済取引リスト) - 決済コンテキスト(曜日, 時間帯, 取引時間間隔, 損益金額, 値幅, トレード回数1, 拘束時間, 決済プラス・マイナス)
// 決済コンテキスト -> 曜日別サマリ
// 決済コンテキスト -> 時間帯別サマリ
// 決済コンテキスト -> 曜日・時間帯別損益額２次元配列
/**
    type Sample = [string, number, number, number, number, number];
    const sample: readonly Sample[] = [
        ['10:00', 159, 6.0, 24, 4.0, 10.0],
        ['11:00', 237, 9.0, 37, 4.3, 10.0],
        ['12:00', 262, 16.0, 24, 6.0, 10.0],
        ['13:00', 305, 3.7, 67, 4.3, 10.0],
        ['14:00', 356, 16.0, 49, 3.9, 10.0],
    ];

    export interface FxTransactionsDataCsvItem {
    order_no: string;
    date: string;
    lot_number: string;
    currency: string;
    buysell: string;
    amount: string;
    price: string;  
    rate: string;
    fee: string;
    swap: string;
    pl: string;
    total_pl: string;
}
export interface FxTransactionsDataNode {

    items: FxTransactionsDataCsvItem[];
}
export interface FxTransactionsDataRecord {
    date: string;
    total_pl: string;
    buysell: string;
    price: number;
} 

    import {FxTransactionsDataRecord} from '../../types';

export default function getOpenInterestRecord(buffer: any[]) : FxTransactionsDataRecord|null {
    
    const result = buffer.filter( (item) => {

        return item.buysell == '新規売' || item.buysell == '新規買';
    });
    if ( result ) {

        return result[0];  
    }
    console.log('ERROR: found multi OpenInterestRecords');
    console.log(JSON.stringify(buffer));
    return null;
}
import {FxTransactionsDataRecord} from '../../types';

export default function getSettlementOrderRecords(buffer: any[]) : FxTransactionsDataRecord[] {

    return buffer.filter( (item) => {

        return item.buysell == '決済売' || item.buysell == '決済買';
    });
}
const _ = require('lodash');

import moment from 'moment';
import { FxTransactionsData, FxTransactionsDataRecord } from '../../types';

import getOpenInterestRecord from './get-open-interest-record';
import getSettlementOrderRecords from './get-settlement-order-records';

const convertToWeek = (month: string, date: string) => {

    const monthStartDay = moment(month, 'YYYY/MM').startOf('month');
    const monthEndDay = moment(month, 'YYYY/MM').endOf('month');
    const weekStartDay = moment(date, 'YYYY/MM/DD').startOf('week');
    let result = null;

    // 月初
    if ( weekStartDay.isBefore(monthStartDay) ) {
        
        result = monthStartDay;
    // 月末
    }else if(weekStartDay.isSame(monthEndDay)) {
        
        result = monthEndDay;
    // 毎週月曜基準
    }else {

        result = weekStartDay.add(1, 'days');
    }

    return result.format('MM/DD〜');
};

export default function formatFxWeeklyTransactions(data: FxTransactionsData, month: string) : any[] {

    let buffer: any[] = [];
    const transactionContexts: any[] = [];
  
    data.allFxTransactionsData.nodes.reduce( (accumulator: any[], currentValue: any) => {
        const items = currentValue.items;
        return [...accumulator, ...items];
    }, []).forEach( (item: any) => { 
        // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/push
        buffer.push(item);

        // 建玉の新規売買のレコードの場合
        if (item.buysell === '新規売' || item.buysell === '新規買') { 

            // 取引を１セット分処理する
            // 建玉の新規売買取引レコードを探す
            const openInterestRecord: FxTransactionsDataRecord|null = getOpenInterestRecord(buffer);
            if (openInterestRecord) {

                // 決済取引レコードを探す
                const settlementOrderRecords: FxTransactionsDataRecord[] = getSettlementOrderRecords(buffer);

                const contexts: any[] = settlementOrderRecords.filter( (record: FxTransactionsDataRecord) => { 
                    // see https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/filter#parameters
                    return record.date.startsWith(month);
                }).map( (record: FxTransactionsDataRecord) => {

                    const week = convertToWeek(month, record.date);
        
                    const profit = parseInt(record.total_pl);
                    const pips = Math.abs(Math.round(100 * (record.price - openInterestRecord.price)));

                    return {
                        name: week,
                        profit,
                        pips
                    };
                });

                if (contexts.length > 0) {

                    // スプレッド構文 https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Spread_syntax
                    transactionContexts.push(...contexts);
                }  
            }

            // バッファクリア
            buffer = [];
        }

    });
    transactionContexts.reduce( (previous, current) => {
        const aggregateKey: string = current.name;
        if (aggregateKey in previous) {

            previous[aggregateKey].push(current);
        }else {
            
            previous[aggregateKey] = [];
            previous[aggregateKey].push(current);
        }
        return previous;
    }, {});

    const groupedTransactionContexts = transactionContexts.reduce( (accumulator, current) => {
        const aggregateKey: string = current.name;
        if (aggregateKey in accumulator) {

            accumulator[aggregateKey].push(current);
        }else {
            
            accumulator[aggregateKey] = [];
            accumulator[aggregateKey].push(current);
        }
        return accumulator;
    }, {});
    // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/entries#try_it
    const results = Object.values(groupedTransactionContexts).map( (contexts: any) => {

        return contexts.length === 1 ? contexts[0] : contexts.reduce( (accumulator: any, current: any) => {
            // https://lodash.com/docs/#isEmpty
            if (_.isEmpty(accumulator)) {
                return current;
            }
            // 集約
            accumulator.profit += current.profit; 
            accumulator.pips += current.pips;

            return accumulator;
        }, {});
    });
    // ソートして返却
    results.sort( (a, b) => {

        if (a.name == b.name) return 0;

        return a.name   > b.name ? 1 : -1;
    });
    return results;

}

 */
/**
 *  
 *  - 曜日別分析
        - 相場環境に加えて、自分のライフスタイルも加味して分析
            - 生活リズムなども踏まえて、調子がいい曜日やそうでない曜日が、もしかしたらあるかもしれません
            - 曜日別の相場環境として認識
                - 週明けの月曜日の午前中は海外ではまだ日曜日
                - 金曜日にはポジションを手仕舞ってから週末を迎えたいという思惑も交錯
                    - それまでの流れが一旦終わることも多い
    - 時間帯別分析
        - トレード結果を時間帯別で分析
            - どの時間帯が自分のトレードスタイルにあっているか
            - 限られた時間しかトレードできないのであれば、その時間帯に合わせて手法を絞っていく
            - その時間帯にメインとなる市場によってそれぞれ値動きの特徴
                - FX市場自体は24時間オープン
                - 9時～15時には日本を中心としたアジア地域がメイン
                  - 比較的落ち着いた動きに終始
                - 16時にロンドン市場がオープンするタイミングに合わせて、価格が活発
                - 21時以降はニューヨーク市場がオープンし、相場参加者がさらに増え、市場はより活性化
 */
/**
 * 
 *  - 損益金額（円）
      - いくら利益を出せたか(損失を出したか)
    - 値幅（pips）
      - どのくらいの値幅だったか
        - 損益金額だけでなく、通過ペアの値幅も見ることで効率をチェックする
          - 預託保証金をしっかり使って取引できているか
          - 値幅が大きいのに損益が小さい場合、エントリポイントか決済タイミングを見直せるかもしれない
    - トレード回数
      - 損益金額だけでなく、トレード回数も見ることで効率をチェックする
    - 取引時間間隔(トレードスタイル)
      - 15分未満 = スキャルピング
      - 15分以上 - 1日以内 = デイトレ
      - 1日より大  = スイング
    - 拘束時間
      - 損益金額を得るために、どのくらいの時間拘束されていたか
        - その日の初回取引時刻と最終取引時刻の差(絶対値)が拘束時間を日毎に集計
          - 週単位・月単位にまとめるときは、最大・最小・平均・中央値で出す
    - 勝率
        - 決済注文時に損益合計がプラスになる取引の割合
            - プラスになる取引の割合の計算 = 決済注文時に損益合計の計算結果がプラスになる売買の数 / 建玉の新規売買の回数
                - 決済注文時に損益合計の計算 = 建玉の新規売買ごとに、建玉の新規売買に対応する決済注文の損益を合算
    - 損益率
        - 利益幅と損切り幅の比率

 * 
 */
            console.log(value.length);
            return value;
        }));
    }
    /**
     * findDataByKey
     * @param key 
     * @returns 
     */
    async findDataByKey(key: string) : Promise<any[]>{

        const client = new S3({region: 'ap-northeast-1'});
        const object = await client.getObject( {
            Bucket: process.env.NESTJS_DATA_S3_BUCKET,
            Key: key
        });
        // https://github.com/aws/aws-sdk-js-v3/issues/1877#issuecomment-755387549
        // AWS SDK v3では GetObjectOutput.Body が stream.Readable
        // only Browser: ReadableStream | Blob
        // Readable: only Node 
        const stream = object.Body as Readable;

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = []
            stream.on('data', chunk => chunks.push(chunk))
            stream.once('end', () => {
                const buffer: Buffer = Buffer.concat(chunks);
                const records = buffer.toString('utf-8').split('\n').map((record) => {

                    return record.split(',');
                });
                resolve(records);
            })
            stream.once('error', reject)
        });
    }
 }
