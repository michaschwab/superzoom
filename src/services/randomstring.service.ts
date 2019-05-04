import { Injectable } from '@angular/core';

@Injectable()
export class RandomstringService
{
    letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    constructor()
    {
    
    }
    
    
    getRandomString(length : number) : string
    {
        let string = '';
        
        for(let i = 0; i < length; i++)
        {
            string += this.letters[Math.round(Math.random() * (this.letters.length - 1))];
        }
        
        return string;
    }
    
}
