export class User {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;

    birthDate: number;
    street: string;
    zipCode: number;
    city: string;

    password: string = '';
    active: boolean = false;

    constructor(obj?: any) {        // das "?" heißt die mitgabe eines obj ist optional

        this.id = obj?.id;
        this.firstName = obj ? obj.firstName : '';
        this.lastName = obj ? obj.lastName : '';
        this.email = obj ? obj.email : '';

        this.birthDate = obj ? obj.birthDate : '';
        this.street = obj ? obj.street : '';
        this.zipCode = obj ? obj.zipCode : '';
        this.city = obj ? obj.city : '';

        this.password = obj ? obj.password : '';
        
    }

    public toJSON() {
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            birthDate: this.birthDate,
            street: this.street,
            zipCode: this.zipCode,
            city: this.city,

            password: this.password,
        };
    }
}