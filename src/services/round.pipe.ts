import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'round'})
export class RoundPipe implements PipeTransform {
    transform (input: number, arg: number) {
        const exponent = arg ? arg : 0;
        const multiplier = Math.pow(10, exponent);
        return Math.round(multiplier * input) / multiplier;
    }
}
