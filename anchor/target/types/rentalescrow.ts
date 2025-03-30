/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/rentalescrow.json`.
 */
export type Rentalescrow = {
  "address": "Eb6EE58yZdHSVrqNoB47hajyNGwe2PxCNf8EacmrhTmu",
  "metadata": {
    "name": "rentalescrow",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "book",
      "discriminator": [
        78,
        39,
        190,
        43,
        50,
        252,
        147,
        47
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "guestTokenAccount",
          "writable": true
        },
        {
          "name": "bookingPayment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  111,
                  107,
                  105,
                  110,
                  103,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "params.booking_id"
              },
              {
                "kind": "arg",
                "path": "params.host_pk"
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "bookingPaymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  111,
                  107,
                  105,
                  110,
                  103,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "params.booking_id"
              },
              {
                "kind": "arg",
                "path": "params.host_pk"
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "bookInstructionParams"
            }
          }
        }
      ]
    },
    {
      "name": "hostWithdraw",
      "discriminator": [
        237,
        113,
        163,
        47,
        206,
        140,
        200,
        34
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "hostTokenAccount",
          "writable": true
        },
        {
          "name": "guestAccount",
          "docs": [
            "CHECK if this account is owned by system program"
          ],
          "writable": true
        },
        {
          "name": "bookingPayment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  111,
                  107,
                  105,
                  110,
                  103,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "params.booking_id"
              },
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "account",
                "path": "guestAccount"
              }
            ]
          }
        },
        {
          "name": "bookingPaymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  111,
                  107,
                  105,
                  110,
                  103,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "params.booking_id"
              },
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "account",
                "path": "guestAccount"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "hostWithdrawParams"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "booking",
      "discriminator": [
        147,
        50,
        61,
        138,
        208,
        21,
        254,
        156
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "bookingAmountInvalid",
      "msg": "Invalid booking amount"
    },
    {
      "code": 6001,
      "name": "startDateInvalid",
      "msg": "Invalid start date"
    },
    {
      "code": 6002,
      "name": "endDateInvalid",
      "msg": "Invalid end date"
    },
    {
      "code": 6003,
      "name": "completedBooking",
      "msg": "Booking already completed"
    },
    {
      "code": 6004,
      "name": "bookingIdInvalid",
      "msg": "Invalid booking id"
    },
    {
      "code": 6005,
      "name": "initializedBooking",
      "msg": "Booking already initialized"
    },
    {
      "code": 6006,
      "name": "bookingInvalid",
      "msg": "Invalid booking"
    },
    {
      "code": 6007,
      "name": "withdrawForbidden",
      "msg": "Host can withdraw only after end date"
    },
    {
      "code": 6008,
      "name": "invalidMint",
      "msg": "Invalid mint"
    },
    {
      "code": 6009,
      "name": "invalidGuestAccount",
      "msg": "Invalid guest account"
    }
  ],
  "types": [
    {
      "name": "bookInstructionParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bookingId",
            "type": "string"
          },
          {
            "name": "startDate",
            "type": "i64"
          },
          {
            "name": "endDate",
            "type": "i64"
          },
          {
            "name": "hostPk",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "booking",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "string"
          },
          {
            "name": "startDate",
            "type": "i64"
          },
          {
            "name": "endDate",
            "type": "i64"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "bookingState"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "bookingState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "new"
          }
        ]
      }
    },
    {
      "name": "hostWithdrawParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bookingId",
            "type": "string"
          }
        ]
      }
    }
  ]
};
