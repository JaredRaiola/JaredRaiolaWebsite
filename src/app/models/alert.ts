export interface IAlert {
    title: string;
    body: string;
    optionType: AlertOptions;
}

export enum AlertOptions {
    Ok = 1,
    YesNo = 2,
}