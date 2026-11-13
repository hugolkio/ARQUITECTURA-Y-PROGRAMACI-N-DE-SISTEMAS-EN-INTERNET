// Cambia cada letra por su número (A=10 ... Z=35)
const letrasANumeros = (texto: string): string => {
    return texto.split("").map((c) => {
        const code = c.charCodeAt(0);
        return code >= 65 && code <= 90 ? String(code - 55) : c;
    }).join("");
}

// El número es demasiado grande para Number, así que se calcula por trozos arrastrando el resto
export const mod97 = (digitos: string): number => {
    let resto = 0;

    for(let i = 0; i < digitos.length; i += 7){
        resto = Number(String(resto) + digitos.slice(i, i + 7)) % 97;
    }

    return resto;
}

export const generarIban = (): string => {
    let bban = "";

    for(let i = 0; i < 20; i++){
        bban += Math.floor(Math.random() * 10);
    }

    const control = 98 - mod97(letrasANumeros(bban + "ES00"));

    return "ES" + String(control).padStart(2, "0") + bban;
}

export const esIbanValido = (iban: string): boolean => {
    if(!/^ES\d{22}$/.test(iban)){
        return false;
    }

    // Se mueven los 4 primeros caracteres al final
    const reordenado = iban.slice(4) + iban.slice(0, 4);

    return mod97(letrasANumeros(reordenado)) === 1;
}
