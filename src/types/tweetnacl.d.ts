declare module 'tweetnacl' {
  export namespace sign {
    export function detached(
      message: Uint8Array,
      secretKey: Uint8Array
    ): Uint8Array;
  }

  export namespace sign {
    export function verify(
      message: Uint8Array,
      signature: Uint8Array,
      publicKey: Uint8Array
    ): boolean;
  }
} 