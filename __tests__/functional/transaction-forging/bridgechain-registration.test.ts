import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";
import secrets from "@packages/core-test-framework/src/internal/secrets.json";
import * as support from "./__support__";

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Transaction Forging - Bridgechain registration", () => {
    describe("Signed with 1 Passphrase", () => {
        it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
            // Registering a business
            const businessRegistration = TransactionFactory.init(app)
                .businessRegistration({
                    name: "arkecosystem",
                    website: "https://ark.io",
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Registering a bridgechain
            const bridgechainRegistration = TransactionFactory.init(app)
                .bridgechainRegistration({
                    name: "cryptoProject",
                    seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();
        });

        it("should reject bridgechain registration, because bridgechain registration with same name is already in the pool [Signed with 1 Passphrase]", async () => {
            // Registering a bridgechain
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject2",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            })
                .withPassphrase(secrets[0])
                .createOne();

            const bridgechainRegistration2 = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject2",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "http://www.repository.com/myorg/myrepo",
            })
                .withPassphrase(secrets[0])
                .withNonce(bridgechainRegistration.nonce.plus(1))
                .createOne();

            await expect([bridgechainRegistration, bridgechainRegistration2]).not.toBeAllAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();
            await expect(bridgechainRegistration2.id).not.toBeForged();
        });

        it("should broadcast, accept and forge it again [Signed with 1 Passphrase]", async () => {
            // Registering a bridgechain again
            const bridgechainRegistration = TransactionFactory.init(app)
                .bridgechainRegistration({
                    name: "cryptoProject",
                    seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();
        });

        it("should reject bridgechain registration, because bridgechain name contains unicode control characters [Signed with 1 Passphrase]", async () => {
            // Bridgechain registration
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "\u0008mybridgechain",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "somerepository",
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeRejected();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).not.toBeForged();
        });

        it("should reject bridgechain registration, because bridgechain name contains disallowed characters [Signed with 1 Passphrase]", async () => {
            // Bridgechain registration
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "mybridgech@in",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "somerepository",
            })
                .withPassphrase(secrets[0])
                .createOne();

            await expect(bridgechainRegistration).toBeRejected();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).not.toBeForged();
        });

        it("should reject bridgechain registration, because business resigned [Signed with 1 Passphrase]", async () => {
            // Business resignation
            const businessResignation = TransactionFactory.init(app)
                .businessResignation()
                .withPassphrase(secrets[0])
                .createOne();

            await expect(businessResignation).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessResignation.id).toBeForged();

            // Bridgechain resignation
            const bridgechainRegistration = TransactionFactory.init(app)
                .bridgechainRegistration({
                    name: "cryptoProject",
                    seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                })
                .withPassphrase(secrets[0])
                .createOne();

            expect(bridgechainRegistration).toBeRejected();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).not.toBeForged();
        });

        it("should reject bridgechain registration, because bridgechainRepository is invalid uri [Signed with 1 Passphrase]", async () => {
            // Business registration
            const businessRegistration = TransactionFactory.businessRegistration({
                name: "arkecosystem",
                website: "https://ark.io",
            })
                .withPassphrase(secrets[5])
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Bridgechain registration
            const bridgechainRegistration = TransactionFactory.bridgechainRegistration({
                name: "cryptoProject",
                seedNodes: ["1.2.3.4", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                bridgechainRepository: "repository.com/myorg/myrepo",
            })
                .withPassphrase(secrets[5])
                .createOne();

            await expect(bridgechainRegistration).toBeRejected();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).not.toBeForged();
        });
    });

    describe("Signed with 2 Passphrases", () => {
        it("should broadcast, accept and forge it [Signed with 2 Passphrases] ", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.init(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 150 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.init(app)
                .secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(secondSignature.id).toBeForged();

            // Registering a business
            const businessRegistration = TransactionFactory.init(app)
                .businessRegistration({
                    name: "arkecosystem",
                    website: "ark.io",
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Registering a bridgechain
            const bridgechainRegistration = TransactionFactory.init(app)
                .bridgechainRegistration({
                    name: "cryptoProject",
                    seedNodes: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                })
                .withPassphrase(passphrase)
                .withSecondPassphrase(secondPassphrase)
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();
        });
    });

    describe("Signed with multi signature [3 of 3]", () => {
        // Register a multi signature wallet with defaults
        const passphrase = generateMnemonic();
        const passphrases = [passphrase, secrets[4], secrets[5]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        it("should broadcast, accept and forge it [3-of-3 multisig]", async () => {
            // Funds to register a multi signature wallet
            const initialFunds = TransactionFactory.init(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Registering a multi-signature wallet
            const multiSignature = TransactionFactory.init(app)
                .multiSignature(participants, 3)
                .withPassphrase(passphrase)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(multiSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignature.id).toBeForged();

            // Send funds to multi signature wallet
            const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature.asset.multiSignature);
            const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature.asset.multiSignature);

            const multiSignatureFunds = TransactionFactory.init(app)
                .transfer(multiSigAddress, 100 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(multiSignatureFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(multiSignatureFunds.id).toBeForged();

            // Registering a business
            const businessRegistration = TransactionFactory.init(app)
                .businessRegistration({
                    name: "ark",
                    website: "ark.io",
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(businessRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(businessRegistration.id).toBeForged();

            // Registering a bridgechain
            const bridgechainRegistration = TransactionFactory.init(app)
                .bridgechainRegistration({
                    name: "cryptoProject",
                    seedNodes: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
                    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                })
                .withSenderPublicKey(multiSigPublicKey)
                .withPassphraseList(passphrases)
                .createOne();

            await expect(bridgechainRegistration).toBeAccepted();
            await snoozeForBlock(1);
            await expect(bridgechainRegistration.id).toBeForged();
        });
    });
});
