const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Aceita número ou texto ("33.34"): o driver pg costuma devolver NUMERIC como texto.
export const moeda = (valor) => brl.format(Number(valor) || 0);

export const dataBR = (iso) => {
  if (!iso) return '';
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

export const mesPorExtenso = (referencia) => {
  const [ano, mes] = referencia.split('-').map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const soDigitos = (texto) => String(texto ?? '').replace(/\D/g, '');

export function mascaraCpf(valor) {
  return soDigitos(valor)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Máscara de dinheiro: digita 12345 e aparece 123,45
export function mascaraValor(texto) {
  const digitos = soDigitos(texto);
  if (!digitos) return '';
  return (Number(digitos) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export const numeroParaCampo = (numero) => mascaraValor(String(Math.round(Number(numero) * 100)));
export const paraNumero = (texto) => Number(String(texto ?? '').replace(/\./g, '').replace(',', '.')) || 0;

// Valida os dois dígitos verificadores do CPF (função do enunciado)
export function cpfValido(cpf) {
  const d = String(cpf).replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

export const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const senhaValida = (senha) => senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);

const pad = (n) => String(n).padStart(2, '0');
export const dataISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hojeISO = () => dataISO(new Date());
export const inicioDoMes = (ref = new Date()) => dataISO(new Date(ref.getFullYear(), ref.getMonth(), 1));
export const fimDoMes = (ref = new Date()) => dataISO(new Date(ref.getFullYear(), ref.getMonth() + 1, 0));

export const NOMES_TIPO_FONTE = { renda: 'Renda', conta: 'Conta', cartao_credito: 'Cartão de crédito' };
