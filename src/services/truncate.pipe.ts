import {Pipe} from '@angular/core'

@Pipe({
    name: 'truncate'
})
export class TruncatePipe {
    transform(value: string, limit: number) : string {
        /*console.log(args);
        let limit = args.length > 0 ? parseInt(args[0], 10) : 10;*/
        //let trail = args.length > 1 ? args[1] : '...';
        let trail = '..';
        
        return value.length > limit ? value.substring(0, limit) + trail : value;
    }
}
