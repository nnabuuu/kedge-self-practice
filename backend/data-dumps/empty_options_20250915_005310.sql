-- SQL dump of quiz records with empty/invalid options
-- Generated: 2025年 9月15日 星期一 00时53分15秒 CST
-- Database: kedge_db
-- Total problematic records: 1152

BEGIN;

-- Backup table for safety
CREATE TABLE IF NOT EXISTS kedge_practice.quizzes_empty_options_backup AS
SELECT * FROM kedge_practice.quizzes
WHERE 
    options IS NULL OR 
    options::text = '[]' OR
    options::text = 'null' OR
    (options IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(options) AS elem 
        WHERE trim(elem) != ''
    ));

-- Records with problematic options
-- Record: a13abbe2-d0e3-4c1d-a509-09cce6b2c321 (Type: single-choice, Options: ["", "", "", ""])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a13abbe2-d0e3-4c1d-a509-09cce6b2c321';

-- Record: fc8c59d4-62ae-43e7-9456-9b7798258175 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fc8c59d4-62ae-43e7-9456-9b7798258175';

-- Record: 484de94a-d66f-4ceb-84a4-d1edaa0ee767 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '484de94a-d66f-4ceb-84a4-d1edaa0ee767';

-- Record: 98626fc4-b20b-4270-a635-3b9474304387 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '98626fc4-b20b-4270-a635-3b9474304387';

-- Record: 6c283dc4-81ed-44f7-8f23-41ccf33e5968 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6c283dc4-81ed-44f7-8f23-41ccf33e5968';

-- Record: 35b51d60-d1eb-4552-ab95-39edb958abdf (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '35b51d60-d1eb-4552-ab95-39edb958abdf';

-- Record: e16edbf8-3b50-43b8-9bb3-5369f3b6c57f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e16edbf8-3b50-43b8-9bb3-5369f3b6c57f';

-- Record: d9bce1b7-acf8-4b1c-98c3-38962bc5bb02 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd9bce1b7-acf8-4b1c-98c3-38962bc5bb02';

-- Record: 95f4212d-a25e-45fe-9e46-bf7008426b46 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '95f4212d-a25e-45fe-9e46-bf7008426b46';

-- Record: 39dbdf70-1c05-4bbc-9834-ea7a7b0155bd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '39dbdf70-1c05-4bbc-9834-ea7a7b0155bd';

-- Record: a30f224a-89ab-4875-a4f7-ea5c0c4f1c03 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a30f224a-89ab-4875-a4f7-ea5c0c4f1c03';

-- Record: ebb08a74-58a6-4f14-a069-75fc3a0e5089 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ebb08a74-58a6-4f14-a069-75fc3a0e5089';

-- Record: f1203e14-922e-4c4f-a81a-a558adcfba6b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f1203e14-922e-4c4f-a81a-a558adcfba6b';

-- Record: ea855989-23d2-4464-8bab-23a139a09add (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ea855989-23d2-4464-8bab-23a139a09add';

-- Record: f13fd904-e58a-4fc9-a28b-0f35cfa8e8cd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f13fd904-e58a-4fc9-a28b-0f35cfa8e8cd';

-- Record: e7e05636-49e7-4669-8cc0-b9cd94592768 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e7e05636-49e7-4669-8cc0-b9cd94592768';

-- Record: ef145568-bb4d-4449-a5dc-fe5080080306 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ef145568-bb4d-4449-a5dc-fe5080080306';

-- Record: 6b301976-a5c1-4993-8ce6-e4b595b4964d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6b301976-a5c1-4993-8ce6-e4b595b4964d';

-- Record: 40c5329c-de0e-44e8-a46a-07c16fee6886 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '40c5329c-de0e-44e8-a46a-07c16fee6886';

-- Record: 1ee1c91b-5554-4b5d-b47e-d762664bcb22 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1ee1c91b-5554-4b5d-b47e-d762664bcb22';

-- Record: 7ed9403c-9e2c-40a9-a894-f7b315c09910 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7ed9403c-9e2c-40a9-a894-f7b315c09910';

-- Record: 4eb85c2f-29a1-4612-b08b-38984d246fc8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4eb85c2f-29a1-4612-b08b-38984d246fc8';

-- Record: 246c8ea7-0328-444e-8ad5-fea4e7ef183a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '246c8ea7-0328-444e-8ad5-fea4e7ef183a';

-- Record: 5da23d21-5849-4b6e-b445-38fbfbe3451b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5da23d21-5849-4b6e-b445-38fbfbe3451b';

-- Record: a90f92e6-d6b1-4b06-8903-0ca22f47274f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a90f92e6-d6b1-4b06-8903-0ca22f47274f';

-- Record: 78709371-139f-4c22-9ba3-def6212f9d82 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '78709371-139f-4c22-9ba3-def6212f9d82';

-- Record: b97d52b3-642b-47a3-ac70-b09db3ae44d6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b97d52b3-642b-47a3-ac70-b09db3ae44d6';

-- Record: 1b8bb261-e1da-4249-89f7-d9911497c1c7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1b8bb261-e1da-4249-89f7-d9911497c1c7';

-- Record: 8658ebfc-924f-488f-8f55-a3eb1175904c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8658ebfc-924f-488f-8f55-a3eb1175904c';

-- Record: 241018c0-3e0f-4eea-9cee-a6f42569a0fc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '241018c0-3e0f-4eea-9cee-a6f42569a0fc';

-- Record: 1d95f187-18fe-4443-8f49-130d1620882b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1d95f187-18fe-4443-8f49-130d1620882b';

-- Record: 2feeb45c-bad5-49aa-a48f-f86d4da16705 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2feeb45c-bad5-49aa-a48f-f86d4da16705';

-- Record: 2d119b30-b36c-4eec-8952-9981662abefd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2d119b30-b36c-4eec-8952-9981662abefd';

-- Record: 266585d5-c6e7-40dd-9f4c-a9f18a6e578b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '266585d5-c6e7-40dd-9f4c-a9f18a6e578b';

-- Record: 455b2902-16e7-48d0-941e-82fff06c96c2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '455b2902-16e7-48d0-941e-82fff06c96c2';

-- Record: 8d550846-233a-4c49-85cf-13f9d86b1165 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8d550846-233a-4c49-85cf-13f9d86b1165';

-- Record: 075f1df8-f89e-4a13-a085-0657622767ed (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '075f1df8-f89e-4a13-a085-0657622767ed';

-- Record: c8b0ef3c-1155-43d4-a0df-63e81714ef11 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c8b0ef3c-1155-43d4-a0df-63e81714ef11';

-- Record: 6d06fd86-21ed-4b71-b5f8-85bebf22b1d5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6d06fd86-21ed-4b71-b5f8-85bebf22b1d5';

-- Record: 8c90d28c-6275-466a-951e-366440266b36 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8c90d28c-6275-466a-951e-366440266b36';

-- Record: efe62bc1-9418-4fe7-940f-b91ebc8572b7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'efe62bc1-9418-4fe7-940f-b91ebc8572b7';

-- Record: 9b7dcfe8-ed93-4edf-b9ff-eb6d23a4bc27 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9b7dcfe8-ed93-4edf-b9ff-eb6d23a4bc27';

-- Record: 60d57016-61e8-4d31-b7ed-bfd26aea7dd6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '60d57016-61e8-4d31-b7ed-bfd26aea7dd6';

-- Record: fb38d8d9-a95f-40c9-ace6-b52af3462a9e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fb38d8d9-a95f-40c9-ace6-b52af3462a9e';

-- Record: 1d0c0362-42ce-4934-bbf3-d1fe158c27a8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1d0c0362-42ce-4934-bbf3-d1fe158c27a8';

-- Record: 3346a469-78f8-4c80-a54d-b3ca272171cc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3346a469-78f8-4c80-a54d-b3ca272171cc';

-- Record: 4936e73e-ecd8-4197-a0a2-788bc86f41b0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4936e73e-ecd8-4197-a0a2-788bc86f41b0';

-- Record: 14c32666-5644-4e72-8ecb-2873a1bc045e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '14c32666-5644-4e72-8ecb-2873a1bc045e';

-- Record: ec4fee8c-350b-4d48-826d-927d6fe3fde8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ec4fee8c-350b-4d48-826d-927d6fe3fde8';

-- Record: 7979bdc4-ee6b-464f-b493-4c064e306a17 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7979bdc4-ee6b-464f-b493-4c064e306a17';

-- Record: cde64736-df15-4391-a747-00d0029abdeb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cde64736-df15-4391-a747-00d0029abdeb';

-- Record: 280a7a7e-7de1-414e-90db-84717590f63e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '280a7a7e-7de1-414e-90db-84717590f63e';

-- Record: 1968a714-526b-4050-a8ec-deff5ce49a00 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1968a714-526b-4050-a8ec-deff5ce49a00';

-- Record: 352661a3-e8cd-4e2d-8321-59d844c1502c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '352661a3-e8cd-4e2d-8321-59d844c1502c';

-- Record: 019d8a65-5627-4c6d-8a46-959c2a843bf9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '019d8a65-5627-4c6d-8a46-959c2a843bf9';

-- Record: b5215ab0-88bc-45d0-aa56-4a05ee856c1b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b5215ab0-88bc-45d0-aa56-4a05ee856c1b';

-- Record: cca76a22-01fb-49df-81ac-702e5a79b7ef (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cca76a22-01fb-49df-81ac-702e5a79b7ef';

-- Record: 152e79dc-0f19-4d7b-815c-da72d264c837 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '152e79dc-0f19-4d7b-815c-da72d264c837';

-- Record: 2d6a12ff-7ee7-4db7-a594-c603e6b4fe6b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2d6a12ff-7ee7-4db7-a594-c603e6b4fe6b';

-- Record: 662ffd63-1c5c-4263-8623-1069cd71a228 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '662ffd63-1c5c-4263-8623-1069cd71a228';

-- Record: 197342b6-5ffa-40b3-a789-e97346c2add8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '197342b6-5ffa-40b3-a789-e97346c2add8';

-- Record: 587a7774-7a75-43b2-b302-a04e9431d295 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '587a7774-7a75-43b2-b302-a04e9431d295';

-- Record: a50853fe-06f8-4c98-b485-d0ee121af74c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a50853fe-06f8-4c98-b485-d0ee121af74c';

-- Record: a0b245cc-5c1a-49d5-882d-f2711b806334 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a0b245cc-5c1a-49d5-882d-f2711b806334';

-- Record: 83d8abbc-1b75-48ad-8f67-ca874ac01ba0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '83d8abbc-1b75-48ad-8f67-ca874ac01ba0';

-- Record: 17f74327-6770-49fd-ad27-6fc3938ede12 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '17f74327-6770-49fd-ad27-6fc3938ede12';

-- Record: 38f702e6-54de-4f1a-bf38-30308a797eea (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '38f702e6-54de-4f1a-bf38-30308a797eea';

-- Record: b8be79df-abf2-4492-aa37-fc100ff7e4ef (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b8be79df-abf2-4492-aa37-fc100ff7e4ef';

-- Record: a45c98db-7f85-419f-9486-915779d7531d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a45c98db-7f85-419f-9486-915779d7531d';

-- Record: 880533cf-3178-4817-9aea-69c524c622a5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '880533cf-3178-4817-9aea-69c524c622a5';

-- Record: 4e10a8e6-3d8d-4cc4-8870-78f74c2e3931 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4e10a8e6-3d8d-4cc4-8870-78f74c2e3931';

-- Record: 6947d6ad-a932-4e23-a869-02c44a2d4a5a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6947d6ad-a932-4e23-a869-02c44a2d4a5a';

-- Record: d926e78b-dd23-41d0-922f-1125bff732d4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd926e78b-dd23-41d0-922f-1125bff732d4';

-- Record: db70a8aa-ea75-403b-b055-f1859423110f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'db70a8aa-ea75-403b-b055-f1859423110f';

-- Record: f1e107a8-ba02-4d4b-a0f5-d9d51f34b685 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f1e107a8-ba02-4d4b-a0f5-d9d51f34b685';

-- Record: e614df96-819b-4e50-87ca-99652e533671 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e614df96-819b-4e50-87ca-99652e533671';

-- Record: 1997f6e5-2613-4a04-a170-66c73d3bef83 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1997f6e5-2613-4a04-a170-66c73d3bef83';

-- Record: 740a466b-22b2-4758-9d92-4197c4169c5d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '740a466b-22b2-4758-9d92-4197c4169c5d';

-- Record: 69a5acec-48c1-4151-a510-2b0055081354 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '69a5acec-48c1-4151-a510-2b0055081354';

-- Record: 3b6e253c-4d3b-4db3-a134-711a223c3cb5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3b6e253c-4d3b-4db3-a134-711a223c3cb5';

-- Record: 9f5c6ac0-89c8-47f4-8ef3-1326097babcb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9f5c6ac0-89c8-47f4-8ef3-1326097babcb';

-- Record: e2f46557-3c89-4f91-a0cc-e986b8c36d06 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e2f46557-3c89-4f91-a0cc-e986b8c36d06';

-- Record: f8088c93-012e-4dc4-8595-27c54173cb25 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f8088c93-012e-4dc4-8595-27c54173cb25';

-- Record: cfeec96a-a1b4-4ca4-9570-a98fa48e81f5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cfeec96a-a1b4-4ca4-9570-a98fa48e81f5';

-- Record: f2cefc08-f9ac-4553-a137-180710786dea (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f2cefc08-f9ac-4553-a137-180710786dea';

-- Record: 3872a2b9-2fff-4271-84e6-3191f1440fbd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3872a2b9-2fff-4271-84e6-3191f1440fbd';

-- Record: 4268e43c-8a17-4852-bc13-901531de0f3e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4268e43c-8a17-4852-bc13-901531de0f3e';

-- Record: 809dcfda-58be-40c8-b448-4d986dc024ad (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '809dcfda-58be-40c8-b448-4d986dc024ad';

-- Record: f8c12b50-cc95-4b78-9cfc-45871d5168a0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f8c12b50-cc95-4b78-9cfc-45871d5168a0';

-- Record: 7acb9feb-ee8b-4bf7-bdb2-b491a968c31d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7acb9feb-ee8b-4bf7-bdb2-b491a968c31d';

-- Record: 3e46a47c-cdd2-4fa8-9d16-609313a5a01b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3e46a47c-cdd2-4fa8-9d16-609313a5a01b';

-- Record: 83596cc2-f27c-42fc-b598-9e580d46daab (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '83596cc2-f27c-42fc-b598-9e580d46daab';

-- Record: 1cf73eeb-59d1-4710-a602-a75ad5ab5fcd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1cf73eeb-59d1-4710-a602-a75ad5ab5fcd';

-- Record: fc7786d2-148b-4b9f-ba27-2d8e63cab2bd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fc7786d2-148b-4b9f-ba27-2d8e63cab2bd';

-- Record: 08f74164-3e38-4de8-8534-be0350806036 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '08f74164-3e38-4de8-8534-be0350806036';

-- Record: 12655b90-91f4-47f7-a773-551da5fb1fba (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '12655b90-91f4-47f7-a773-551da5fb1fba';

-- Record: 078e9552-7bd3-4640-a5a7-47bc6ea7ea54 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '078e9552-7bd3-4640-a5a7-47bc6ea7ea54';

-- Record: 1481c5b2-f885-4dc6-9daa-9fe5ced2a04f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1481c5b2-f885-4dc6-9daa-9fe5ced2a04f';

-- Record: 06e3e74d-43a9-4d02-82bf-b578633535e2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '06e3e74d-43a9-4d02-82bf-b578633535e2';

-- Record: 9fd0a557-04cd-42ab-8bee-e4ef8ad1f10f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9fd0a557-04cd-42ab-8bee-e4ef8ad1f10f';

-- Record: d6dfb720-9777-40bb-be42-621b64fc9bca (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd6dfb720-9777-40bb-be42-621b64fc9bca';

-- Record: b5658cfb-ff79-44bd-9b2e-5f90e8b8e459 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b5658cfb-ff79-44bd-9b2e-5f90e8b8e459';

-- Record: 111a23ed-e4b4-4153-b67f-8dbaa7ed0a3d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '111a23ed-e4b4-4153-b67f-8dbaa7ed0a3d';

-- Record: 4c6083bc-f145-4d53-adc8-26a3eb953231 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4c6083bc-f145-4d53-adc8-26a3eb953231';

-- Record: a7f85015-965e-4cd5-bcb6-eb5844ae413e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a7f85015-965e-4cd5-bcb6-eb5844ae413e';

-- Record: d2758674-b5d3-4d95-b5bd-ae41f8aa73b3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd2758674-b5d3-4d95-b5bd-ae41f8aa73b3';

-- Record: 40d07c7d-ea4c-4bcd-8ccc-498904115e0d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '40d07c7d-ea4c-4bcd-8ccc-498904115e0d';

-- Record: 1bbca2ac-cfa9-4338-8542-07fbcbc2919d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1bbca2ac-cfa9-4338-8542-07fbcbc2919d';

-- Record: 8e1ecd34-fc3b-4881-a87e-fa1c84d22d31 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8e1ecd34-fc3b-4881-a87e-fa1c84d22d31';

-- Record: 787d18bb-e125-4fd5-b658-da1c2b2432da (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '787d18bb-e125-4fd5-b658-da1c2b2432da';

-- Record: 662adc3f-ca84-4241-8339-9033cb68e096 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '662adc3f-ca84-4241-8339-9033cb68e096';

-- Record: 7047dae3-5db4-47a3-8e2a-a3d188e73d6a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7047dae3-5db4-47a3-8e2a-a3d188e73d6a';

-- Record: 8166f105-fd75-4a8b-a50d-b3259c3f9542 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8166f105-fd75-4a8b-a50d-b3259c3f9542';

-- Record: 7236133c-cd3a-40bc-8b4c-2db4d84a66d0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7236133c-cd3a-40bc-8b4c-2db4d84a66d0';

-- Record: 78956ab8-8c81-40db-a269-02a40df26016 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '78956ab8-8c81-40db-a269-02a40df26016';

-- Record: 691379e9-d4b9-49a4-a110-7794b2d59a99 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '691379e9-d4b9-49a4-a110-7794b2d59a99';

-- Record: 3ab12bc4-155f-4266-89e0-bf0066403b28 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3ab12bc4-155f-4266-89e0-bf0066403b28';

-- Record: 2819a6c9-5553-4a64-9db7-bee16400370b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2819a6c9-5553-4a64-9db7-bee16400370b';

-- Record: 5406e3d1-e736-4c46-938a-2ddb0765f2e2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5406e3d1-e736-4c46-938a-2ddb0765f2e2';

-- Record: 2bda7cd3-84ac-4db5-804a-992d40d43e72 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2bda7cd3-84ac-4db5-804a-992d40d43e72';

-- Record: c25dabbe-8eb5-43cd-aa9b-dccb5792c311 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c25dabbe-8eb5-43cd-aa9b-dccb5792c311';

-- Record: c6078937-e4de-4989-bd46-769a9fa5e89f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c6078937-e4de-4989-bd46-769a9fa5e89f';

-- Record: f6669e51-b6bf-4c6f-8647-49eeaece1ef0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f6669e51-b6bf-4c6f-8647-49eeaece1ef0';

-- Record: f427a70f-7e52-468c-bacd-90415420c99c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f427a70f-7e52-468c-bacd-90415420c99c';

-- Record: 49790848-e9c8-4217-860f-bf5a9617dd9c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '49790848-e9c8-4217-860f-bf5a9617dd9c';

-- Record: 6721c24e-8886-4a69-9861-53ec0af56f77 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6721c24e-8886-4a69-9861-53ec0af56f77';

-- Record: 96ab3aab-09c7-462f-b721-98a92df43b6c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '96ab3aab-09c7-462f-b721-98a92df43b6c';

-- Record: 1d69afbb-a790-4f9c-8828-ed23c9e7f97d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1d69afbb-a790-4f9c-8828-ed23c9e7f97d';

-- Record: 375985de-1e6b-409f-90ea-cb724e94d8bc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '375985de-1e6b-409f-90ea-cb724e94d8bc';

-- Record: 85c39471-5fe9-4b6b-9093-c2f9d73dc4b6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '85c39471-5fe9-4b6b-9093-c2f9d73dc4b6';

-- Record: 5bb8a179-36b3-403d-a235-4d5eb2e60aef (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5bb8a179-36b3-403d-a235-4d5eb2e60aef';

-- Record: 5d5bc4c0-5c76-4e34-868b-f834e4dc0fa6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5d5bc4c0-5c76-4e34-868b-f834e4dc0fa6';

-- Record: 55f85b60-cc17-470b-bd73-0a4674abdcf2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '55f85b60-cc17-470b-bd73-0a4674abdcf2';

-- Record: deafb5f2-1b3b-4c9c-b807-bd37396ac1c7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'deafb5f2-1b3b-4c9c-b807-bd37396ac1c7';

-- Record: 4c740bda-e2bc-46e2-b318-c8300a050834 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4c740bda-e2bc-46e2-b318-c8300a050834';

-- Record: c5995a0c-f704-48a6-a952-676295e7ee57 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c5995a0c-f704-48a6-a952-676295e7ee57';

-- Record: 2a76a54b-7b3e-4098-a3cf-7933fc7db9f3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2a76a54b-7b3e-4098-a3cf-7933fc7db9f3';

-- Record: 30e61409-943c-4dc2-8da3-6495c8cf1f13 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '30e61409-943c-4dc2-8da3-6495c8cf1f13';

-- Record: 8394726d-6386-41a1-993a-d510323b5eb9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8394726d-6386-41a1-993a-d510323b5eb9';

-- Record: 0171deee-ed91-4222-8512-b739e97e8261 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0171deee-ed91-4222-8512-b739e97e8261';

-- Record: 2b07161c-8d7d-40be-94b7-d161c7fb7694 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2b07161c-8d7d-40be-94b7-d161c7fb7694';

-- Record: eb435f50-5f20-458b-b2f9-b6b3c4c5e258 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'eb435f50-5f20-458b-b2f9-b6b3c4c5e258';

-- Record: 7e30fc06-0193-4192-86c3-93e62e12599e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7e30fc06-0193-4192-86c3-93e62e12599e';

-- Record: ff52b47a-8964-4eb9-a5b6-1023cf5a3f13 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ff52b47a-8964-4eb9-a5b6-1023cf5a3f13';

-- Record: 8958c665-8b28-45ee-9b9f-56aa62a7900f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8958c665-8b28-45ee-9b9f-56aa62a7900f';

-- Record: 7a89dffe-47aa-4a0f-a92c-8109c9b7b245 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7a89dffe-47aa-4a0f-a92c-8109c9b7b245';

-- Record: aa81ed42-ea8a-4af4-a021-ecce383cac49 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'aa81ed42-ea8a-4af4-a021-ecce383cac49';

-- Record: 5ad5c6a8-1975-4d1e-bb38-61c6f01ae8a4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5ad5c6a8-1975-4d1e-bb38-61c6f01ae8a4';

-- Record: e950b53b-531d-438f-b0e7-9424c6bf2199 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e950b53b-531d-438f-b0e7-9424c6bf2199';

-- Record: ad6f8fa6-bb84-4174-905a-26ace8854e7e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ad6f8fa6-bb84-4174-905a-26ace8854e7e';

-- Record: 96720d93-3f95-445f-9799-2f15b484517c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '96720d93-3f95-445f-9799-2f15b484517c';

-- Record: f33bfa08-8148-4e19-acea-0864e41b35f0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f33bfa08-8148-4e19-acea-0864e41b35f0';

-- Record: 8cfd3291-9505-49f7-9bac-ec03303bfabd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8cfd3291-9505-49f7-9bac-ec03303bfabd';

-- Record: 2ddf05f7-b3b5-4d9b-9016-4fb9f3b0f598 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2ddf05f7-b3b5-4d9b-9016-4fb9f3b0f598';

-- Record: 8d5b6f66-ffb9-4120-8c26-d7584d60cc6a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8d5b6f66-ffb9-4120-8c26-d7584d60cc6a';

-- Record: 3d1aa641-76ac-495c-9013-b0ce2fd629dd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3d1aa641-76ac-495c-9013-b0ce2fd629dd';

-- Record: 6ac40bce-221d-4c9b-bff5-df4e21e61bd2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6ac40bce-221d-4c9b-bff5-df4e21e61bd2';

-- Record: 383ab309-b908-4cd8-bdc9-055195ab7bd4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '383ab309-b908-4cd8-bdc9-055195ab7bd4';

-- Record: 5fe09913-1b1f-4eb7-989c-b0dd9ab168cd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5fe09913-1b1f-4eb7-989c-b0dd9ab168cd';

-- Record: e6f185b5-3ca9-4949-bc25-2c30ed88236e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e6f185b5-3ca9-4949-bc25-2c30ed88236e';

-- Record: 82aafb4d-b92a-435b-b683-47205bb14faf (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '82aafb4d-b92a-435b-b683-47205bb14faf';

-- Record: 934066d8-8de7-4ad9-b00c-b7d2d5393b9c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '934066d8-8de7-4ad9-b00c-b7d2d5393b9c';

-- Record: d61bebed-3797-4243-8b75-24c9f8c1965f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd61bebed-3797-4243-8b75-24c9f8c1965f';

-- Record: 49190f7a-532e-4b08-883c-bb4bdbed337c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '49190f7a-532e-4b08-883c-bb4bdbed337c';

-- Record: 07213fe1-1159-4edc-b60e-b3e1e8237912 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '07213fe1-1159-4edc-b60e-b3e1e8237912';

-- Record: f0362814-caaa-48e5-bac8-d2d3377e03da (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f0362814-caaa-48e5-bac8-d2d3377e03da';

-- Record: 2643170b-9340-4e01-8f6b-c2dc672c47b7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2643170b-9340-4e01-8f6b-c2dc672c47b7';

-- Record: 9127aba2-c90b-4028-9d60-c1173c1908c3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9127aba2-c90b-4028-9d60-c1173c1908c3';

-- Record: 28ad1688-f589-42c4-836b-8ff8ad96ce9b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '28ad1688-f589-42c4-836b-8ff8ad96ce9b';

-- Record: f931a7fb-7bc7-4ef9-bcf0-d1dafebe5cea (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f931a7fb-7bc7-4ef9-bcf0-d1dafebe5cea';

-- Record: e1982406-8f7c-4047-ad5e-ed5e80b25a2e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e1982406-8f7c-4047-ad5e-ed5e80b25a2e';

-- Record: 2955ba06-e8fd-4651-8cc7-f5ad4a55c397 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2955ba06-e8fd-4651-8cc7-f5ad4a55c397';

-- Record: 580e4a57-c0fe-4951-ab74-94b1d1758806 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '580e4a57-c0fe-4951-ab74-94b1d1758806';

-- Record: fcdf6963-13ab-46ac-8aec-515ad684354b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fcdf6963-13ab-46ac-8aec-515ad684354b';

-- Record: 4f587a5b-69d8-4c94-b708-947a6af721ad (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4f587a5b-69d8-4c94-b708-947a6af721ad';

-- Record: aaa805d4-ed58-49b7-856c-44fb03e439d2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'aaa805d4-ed58-49b7-856c-44fb03e439d2';

-- Record: aad408dc-7337-4335-9487-16272f7b77e0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'aad408dc-7337-4335-9487-16272f7b77e0';

-- Record: 47a355ac-d660-48f4-8570-eaac9ff6c3f0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '47a355ac-d660-48f4-8570-eaac9ff6c3f0';

-- Record: 15d59b09-c18e-4093-8ff7-f0fc405ae11b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '15d59b09-c18e-4093-8ff7-f0fc405ae11b';

-- Record: c990f196-b54e-46f2-91de-9958572959d2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c990f196-b54e-46f2-91de-9958572959d2';

-- Record: bc2473ef-454e-419d-8806-3c3b6292ca21 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bc2473ef-454e-419d-8806-3c3b6292ca21';

-- Record: ee7b8da5-117c-4b32-8cb4-d065c6c819e2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ee7b8da5-117c-4b32-8cb4-d065c6c819e2';

-- Record: 679b5b06-f1f7-4d95-9676-415dc1c82441 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '679b5b06-f1f7-4d95-9676-415dc1c82441';

-- Record: 3d645ea0-97e0-40da-8268-3aad3dfad514 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3d645ea0-97e0-40da-8268-3aad3dfad514';

-- Record: 53e53dcc-4823-4744-b077-5f258d972445 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '53e53dcc-4823-4744-b077-5f258d972445';

-- Record: 311964d7-b252-4271-a6c7-b0c9f7f295af (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '311964d7-b252-4271-a6c7-b0c9f7f295af';

-- Record: 8d39504a-049f-458a-965c-b7efde801b02 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8d39504a-049f-458a-965c-b7efde801b02';

-- Record: f66239c7-8808-4251-aa10-5ac7691ab969 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f66239c7-8808-4251-aa10-5ac7691ab969';

-- Record: 43ce3420-2373-4de9-9a98-68ff1fa80564 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '43ce3420-2373-4de9-9a98-68ff1fa80564';

-- Record: 9626340a-265e-4067-8176-cd4347942fcd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9626340a-265e-4067-8176-cd4347942fcd';

-- Record: 840ccf5d-d022-48bc-af6f-a3c0d31528d5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '840ccf5d-d022-48bc-af6f-a3c0d31528d5';

-- Record: a524f4d4-847e-40b0-94fa-0d21e8806e9d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a524f4d4-847e-40b0-94fa-0d21e8806e9d';

-- Record: 7f322cac-d43e-44e5-b428-1b514fd7e183 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7f322cac-d43e-44e5-b428-1b514fd7e183';

-- Record: 39460e57-400a-4efe-a7a6-1b55782920f2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '39460e57-400a-4efe-a7a6-1b55782920f2';

-- Record: 12ac3ca4-b0c3-400e-a992-7694d0459feb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '12ac3ca4-b0c3-400e-a992-7694d0459feb';

-- Record: 71024b23-6711-4dd2-b2a0-083c5a428c2d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '71024b23-6711-4dd2-b2a0-083c5a428c2d';

-- Record: be28e7d7-fa53-4f97-93e2-b3df88759dbd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'be28e7d7-fa53-4f97-93e2-b3df88759dbd';

-- Record: 02c78448-8584-441d-b421-2f27409c2ab2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '02c78448-8584-441d-b421-2f27409c2ab2';

-- Record: aa1b8340-8de9-4666-992c-d31402b4cdc7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'aa1b8340-8de9-4666-992c-d31402b4cdc7';

-- Record: ad7fb29c-9b6b-4ed5-91f4-2192a6233bd9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ad7fb29c-9b6b-4ed5-91f4-2192a6233bd9';

-- Record: ffd0679a-d1c6-49f0-a021-6ef08a3c09ea (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ffd0679a-d1c6-49f0-a021-6ef08a3c09ea';

-- Record: d930d628-7154-4b82-94a2-02c156c91cb6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd930d628-7154-4b82-94a2-02c156c91cb6';

-- Record: 17b461a4-2958-4f20-b70e-9d2aaf1cf722 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '17b461a4-2958-4f20-b70e-9d2aaf1cf722';

-- Record: 0f62d7a2-013d-4d87-b6de-e53a325eaab8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0f62d7a2-013d-4d87-b6de-e53a325eaab8';

-- Record: 4198b99a-649d-4fc1-8346-9f5e60a24089 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4198b99a-649d-4fc1-8346-9f5e60a24089';

-- Record: e9cab25a-2222-4cc0-a849-3f91df454cfa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e9cab25a-2222-4cc0-a849-3f91df454cfa';

-- Record: a8a3bfd7-a2a0-4324-94b8-ada88aa39815 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a8a3bfd7-a2a0-4324-94b8-ada88aa39815';

-- Record: 1498c31b-b0ce-4274-a5d5-e7d333661db2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1498c31b-b0ce-4274-a5d5-e7d333661db2';

-- Record: 126dc096-89b4-4234-8a3d-02a99cedec42 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '126dc096-89b4-4234-8a3d-02a99cedec42';

-- Record: 6027e07c-9831-4f27-a932-a4075fd48c35 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6027e07c-9831-4f27-a932-a4075fd48c35';

-- Record: cad8e987-2071-4f54-88f0-f5b428565c6f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cad8e987-2071-4f54-88f0-f5b428565c6f';

-- Record: 73bc4046-04f6-47e6-aef0-868489d742c4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '73bc4046-04f6-47e6-aef0-868489d742c4';

-- Record: 1740242a-8733-4f56-8f61-76e27bb92dac (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1740242a-8733-4f56-8f61-76e27bb92dac';

-- Record: e1d9cef0-86d5-48bc-b146-497b92d0158c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e1d9cef0-86d5-48bc-b146-497b92d0158c';

-- Record: d1451772-fbc7-45d3-be93-a511378ca92b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd1451772-fbc7-45d3-be93-a511378ca92b';

-- Record: 7bce8d6b-780c-4355-8533-308a941e293c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7bce8d6b-780c-4355-8533-308a941e293c';

-- Record: e70c067e-2567-4f5b-87ef-de8d662cfe66 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e70c067e-2567-4f5b-87ef-de8d662cfe66';

-- Record: 607777bc-9a72-4c3d-a708-a4c3bf358734 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '607777bc-9a72-4c3d-a708-a4c3bf358734';

-- Record: 5b858694-e4ff-4408-9a76-4d50a527e983 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5b858694-e4ff-4408-9a76-4d50a527e983';

-- Record: 4cfcb479-b22b-42e5-8fe7-597363f2d0ff (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4cfcb479-b22b-42e5-8fe7-597363f2d0ff';

-- Record: 107ec8b9-ad1c-40ad-8605-7429de78d937 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '107ec8b9-ad1c-40ad-8605-7429de78d937';

-- Record: 702743e1-61c0-41f2-9f51-2f15df22580f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '702743e1-61c0-41f2-9f51-2f15df22580f';

-- Record: 42affa8c-6259-4133-90c8-a2382ecf7fa2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '42affa8c-6259-4133-90c8-a2382ecf7fa2';

-- Record: 33facfc8-49f8-40dc-b03b-2fbde12352fa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '33facfc8-49f8-40dc-b03b-2fbde12352fa';

-- Record: 384b21d1-f977-4125-b56c-a8f79e0210c3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '384b21d1-f977-4125-b56c-a8f79e0210c3';

-- Record: b198528f-8de7-4f74-bcb9-e0dcb7ba5f4a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b198528f-8de7-4f74-bcb9-e0dcb7ba5f4a';

-- Record: 11bd556c-8159-40a5-a2b7-7e4f4163ff43 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '11bd556c-8159-40a5-a2b7-7e4f4163ff43';

-- Record: 740ac172-b2bd-4740-b60e-0acda4ddd1d4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '740ac172-b2bd-4740-b60e-0acda4ddd1d4';

-- Record: 2a8bc616-9778-41e5-9e72-2adb0ad94dae (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2a8bc616-9778-41e5-9e72-2adb0ad94dae';

-- Record: 127c639e-a1f4-43ea-819d-963b429d17be (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '127c639e-a1f4-43ea-819d-963b429d17be';

-- Record: 9082461e-9e3b-4d3f-9d6c-a74a8cee84a1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9082461e-9e3b-4d3f-9d6c-a74a8cee84a1';

-- Record: d252f362-94eb-4981-b651-63e6e5467501 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd252f362-94eb-4981-b651-63e6e5467501';

-- Record: 2379baff-70ab-4841-93af-7fc966ab0d03 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2379baff-70ab-4841-93af-7fc966ab0d03';

-- Record: 06c4c5f3-3a5e-42d6-9076-471fc72c9211 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '06c4c5f3-3a5e-42d6-9076-471fc72c9211';

-- Record: 05464e2b-122b-4988-b84c-75d21d015c85 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '05464e2b-122b-4988-b84c-75d21d015c85';

-- Record: e908927f-6d10-4a23-9ab3-e1b86de58f7c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e908927f-6d10-4a23-9ab3-e1b86de58f7c';

-- Record: 0ccc8147-b5cf-4ada-8434-386bab0aba8e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0ccc8147-b5cf-4ada-8434-386bab0aba8e';

-- Record: 9ee1b3b6-be37-40dc-b714-0d66c690dc54 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9ee1b3b6-be37-40dc-b714-0d66c690dc54';

-- Record: f19d8996-c7cf-427c-be20-dfa7b1f208e6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f19d8996-c7cf-427c-be20-dfa7b1f208e6';

-- Record: 58e8904d-122b-487f-b447-131c2da7a67e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '58e8904d-122b-487f-b447-131c2da7a67e';

-- Record: e8055879-abed-42f9-96db-bb998df069f9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e8055879-abed-42f9-96db-bb998df069f9';

-- Record: 2249dbd6-fd42-46b3-90ef-e92d33a037b8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2249dbd6-fd42-46b3-90ef-e92d33a037b8';

-- Record: 73c5f46e-2743-4d8b-8860-9cbd0844ba1f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '73c5f46e-2743-4d8b-8860-9cbd0844ba1f';

-- Record: f44c3af9-d5d3-4b23-b504-0271c864986e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f44c3af9-d5d3-4b23-b504-0271c864986e';

-- Record: 45996a4a-9c69-4c69-9c7c-eab28d760eeb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '45996a4a-9c69-4c69-9c7c-eab28d760eeb';

-- Record: 981f5cba-bd6c-4a07-9892-9598384ef882 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '981f5cba-bd6c-4a07-9892-9598384ef882';

-- Record: eb1c0d73-1227-4a9d-8186-9558984d6902 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'eb1c0d73-1227-4a9d-8186-9558984d6902';

-- Record: 4e56801b-62ba-446e-a72a-44638a97a4d1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4e56801b-62ba-446e-a72a-44638a97a4d1';

-- Record: 6d95d079-d43c-4a13-a81d-9d5a72c33b34 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6d95d079-d43c-4a13-a81d-9d5a72c33b34';

-- Record: 789559e9-1201-41c0-a23b-1e3a123605fa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '789559e9-1201-41c0-a23b-1e3a123605fa';

-- Record: 46fa5c35-fd54-401f-84cc-19ec386a2829 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '46fa5c35-fd54-401f-84cc-19ec386a2829';

-- Record: 0fd65797-1870-4965-aa43-71ea1445b4b2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0fd65797-1870-4965-aa43-71ea1445b4b2';

-- Record: f82dc292-12aa-4454-833c-e8fd7368a57f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f82dc292-12aa-4454-833c-e8fd7368a57f';

-- Record: e53a1b41-6494-48b7-93ed-2fc2c8b2573c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e53a1b41-6494-48b7-93ed-2fc2c8b2573c';

-- Record: 6a8863e2-581e-453f-8ad1-93d8dcd3669f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6a8863e2-581e-453f-8ad1-93d8dcd3669f';

-- Record: 0d9fd914-f6cd-423d-bb91-29fa8caf6908 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0d9fd914-f6cd-423d-bb91-29fa8caf6908';

-- Record: 4761c05f-029e-49d5-b523-7abb212ed824 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4761c05f-029e-49d5-b523-7abb212ed824';

-- Record: c4ac86ac-7991-4b80-bf76-fa97fd4deda7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c4ac86ac-7991-4b80-bf76-fa97fd4deda7';

-- Record: ea2c9780-4d84-4b61-9d8f-25fb9d16e372 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ea2c9780-4d84-4b61-9d8f-25fb9d16e372';

-- Record: 9101bdec-8ca7-490e-8a09-a0d76e9798e0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9101bdec-8ca7-490e-8a09-a0d76e9798e0';

-- Record: 5433df70-67a9-4f4b-b725-513bc6cf3d81 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5433df70-67a9-4f4b-b725-513bc6cf3d81';

-- Record: 0c218334-be10-49b5-a292-5d81f5b629af (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0c218334-be10-49b5-a292-5d81f5b629af';

-- Record: 0b68387c-be43-4616-a27c-ea95476e3f6c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0b68387c-be43-4616-a27c-ea95476e3f6c';

-- Record: a71c04e1-5d7d-4267-a3b7-f0462dd823fa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a71c04e1-5d7d-4267-a3b7-f0462dd823fa';

-- Record: ef9c5507-65c0-421f-b735-9984a2a18d84 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ef9c5507-65c0-421f-b735-9984a2a18d84';

-- Record: 339eb00e-e9e6-475d-aa82-7b3a95f38926 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '339eb00e-e9e6-475d-aa82-7b3a95f38926';

-- Record: 92930a15-158e-4426-a04c-e4e98e9d7997 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '92930a15-158e-4426-a04c-e4e98e9d7997';

-- Record: e21198ab-f3ac-4dd1-85fd-8684597d27b3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e21198ab-f3ac-4dd1-85fd-8684597d27b3';

-- Record: 85e9e608-2e19-4e14-bd3f-d914f28618ac (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '85e9e608-2e19-4e14-bd3f-d914f28618ac';

-- Record: 1bddd66e-1491-4d25-b4d4-5d06eb5bbee2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1bddd66e-1491-4d25-b4d4-5d06eb5bbee2';

-- Record: ff994cd6-f430-47d8-b5fe-8e6b659a0bcb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ff994cd6-f430-47d8-b5fe-8e6b659a0bcb';

-- Record: 66c998da-da38-4c32-87b5-1b75f63362a0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '66c998da-da38-4c32-87b5-1b75f63362a0';

-- Record: 0a83beac-eb64-4702-96f0-dab072265b92 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0a83beac-eb64-4702-96f0-dab072265b92';

-- Record: 1b2d7c7e-d88d-4d80-8479-d36e4be4f869 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1b2d7c7e-d88d-4d80-8479-d36e4be4f869';

-- Record: ddc5ee73-9a5d-48ac-83e0-7d96ed675142 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ddc5ee73-9a5d-48ac-83e0-7d96ed675142';

-- Record: d8c06b65-8ecc-444f-9bc7-9dee91f42a78 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd8c06b65-8ecc-444f-9bc7-9dee91f42a78';

-- Record: 4fddf964-a9c0-4c77-bd72-584661fb1a17 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4fddf964-a9c0-4c77-bd72-584661fb1a17';

-- Record: 45f54558-95db-49e4-83ce-df2533f74008 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '45f54558-95db-49e4-83ce-df2533f74008';

-- Record: 37925f29-588b-480e-9d68-495e48a0078d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '37925f29-588b-480e-9d68-495e48a0078d';

-- Record: 70922e9d-2335-4410-ae48-41685f30ea4e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '70922e9d-2335-4410-ae48-41685f30ea4e';

-- Record: ab402a79-746f-45a0-8445-c5fceb84e2f4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ab402a79-746f-45a0-8445-c5fceb84e2f4';

-- Record: c1d52325-8812-40ba-be70-89c4274b43a1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c1d52325-8812-40ba-be70-89c4274b43a1';

-- Record: d6394ddf-a294-4310-a44f-ed090936f61c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd6394ddf-a294-4310-a44f-ed090936f61c';

-- Record: 04975bd2-b741-419c-bfa5-8f9fe526ecf0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '04975bd2-b741-419c-bfa5-8f9fe526ecf0';

-- Record: 746ca38d-024b-4f51-8544-8edf8275107d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '746ca38d-024b-4f51-8544-8edf8275107d';

-- Record: b5f738be-6fe9-4d91-8d5b-f9919bdcda77 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b5f738be-6fe9-4d91-8d5b-f9919bdcda77';

-- Record: 36fc0c5b-8915-4f9e-a376-89e1b0965c90 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '36fc0c5b-8915-4f9e-a376-89e1b0965c90';

-- Record: c49e7d3d-e0ce-4bfc-8481-836d0ed279dc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c49e7d3d-e0ce-4bfc-8481-836d0ed279dc';

-- Record: 4b2fbd18-e53b-40c7-9a6a-65ceb6eec6f2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4b2fbd18-e53b-40c7-9a6a-65ceb6eec6f2';

-- Record: 85629f07-4f60-42e0-87b4-6fdb8764fda1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '85629f07-4f60-42e0-87b4-6fdb8764fda1';

-- Record: 6c404ee8-f44f-4800-a475-2c5df0fb7bc6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6c404ee8-f44f-4800-a475-2c5df0fb7bc6';

-- Record: 3a1c8a80-721e-4c9c-9acf-99ffd80d35d3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3a1c8a80-721e-4c9c-9acf-99ffd80d35d3';

-- Record: bfca1c5c-6d16-401b-8324-a503ddc6ab62 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bfca1c5c-6d16-401b-8324-a503ddc6ab62';

-- Record: 582c6452-29f5-4938-beb0-948c9f77f3a7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '582c6452-29f5-4938-beb0-948c9f77f3a7';

-- Record: cf6c6e5c-55c6-44cd-84e2-4f849c78226c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cf6c6e5c-55c6-44cd-84e2-4f849c78226c';

-- Record: 1c70745e-6b23-437f-a754-255024e9dd75 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1c70745e-6b23-437f-a754-255024e9dd75';

-- Record: d2e5ea9f-d1d9-4c20-b1a2-ba43779df7d2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd2e5ea9f-d1d9-4c20-b1a2-ba43779df7d2';

-- Record: 562185f9-6e60-40eb-a2c4-51662c425ff2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '562185f9-6e60-40eb-a2c4-51662c425ff2';

-- Record: d4874892-dab3-41b4-b41c-80f205fa8e77 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd4874892-dab3-41b4-b41c-80f205fa8e77';

-- Record: 7cfbf47f-65dd-452b-a562-b51c69385de0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7cfbf47f-65dd-452b-a562-b51c69385de0';

-- Record: 0d487fb7-bee9-4ed4-8e34-b473b0ca93dc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0d487fb7-bee9-4ed4-8e34-b473b0ca93dc';

-- Record: 10db5768-b97d-4165-9ff4-2617058d479a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '10db5768-b97d-4165-9ff4-2617058d479a';

-- Record: f0ff7136-1a7b-43a6-bf12-c0020d24fbf3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f0ff7136-1a7b-43a6-bf12-c0020d24fbf3';

-- Record: b6eafb65-40fb-4a2f-b587-991c35248b67 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b6eafb65-40fb-4a2f-b587-991c35248b67';

-- Record: d12d0a93-97a4-4036-b5d4-49e4b9be6d77 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd12d0a93-97a4-4036-b5d4-49e4b9be6d77';

-- Record: 36acdc31-4edd-4b97-8035-29a8683cada9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '36acdc31-4edd-4b97-8035-29a8683cada9';

-- Record: a983048e-25ab-4126-9fb7-91714018498e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a983048e-25ab-4126-9fb7-91714018498e';

-- Record: 262b3e75-5c1b-4ec0-8177-35b1102b195f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '262b3e75-5c1b-4ec0-8177-35b1102b195f';

-- Record: f9e8c2ce-39b1-4da9-b0a4-cf053556525a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f9e8c2ce-39b1-4da9-b0a4-cf053556525a';

-- Record: d6766fb1-a47f-4e52-a29d-f8b028a07801 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd6766fb1-a47f-4e52-a29d-f8b028a07801';

-- Record: e91c1ee6-b727-4409-8f50-e38f969863b8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e91c1ee6-b727-4409-8f50-e38f969863b8';

-- Record: 67d66b40-5b88-4e3c-bee2-2672cf09b392 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '67d66b40-5b88-4e3c-bee2-2672cf09b392';

-- Record: 3d938505-bf0a-4f6f-9a7c-ee2c7f788531 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3d938505-bf0a-4f6f-9a7c-ee2c7f788531';

-- Record: 4ccfb559-3e72-4799-8e55-d7c3b319d5a3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4ccfb559-3e72-4799-8e55-d7c3b319d5a3';

-- Record: b083ccdc-ee9f-4148-963d-3956468c58dd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b083ccdc-ee9f-4148-963d-3956468c58dd';

-- Record: 30d8857c-e187-49f7-a049-1a91650e638c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '30d8857c-e187-49f7-a049-1a91650e638c';

-- Record: 2d060ae1-8dcf-4ce3-9ab2-bba0e517cbf8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2d060ae1-8dcf-4ce3-9ab2-bba0e517cbf8';

-- Record: e6181c23-fb62-4ccc-95f0-9e512706801d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e6181c23-fb62-4ccc-95f0-9e512706801d';

-- Record: b9a1e221-af90-4050-8c89-35a53a0fb524 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b9a1e221-af90-4050-8c89-35a53a0fb524';

-- Record: 7684f8e3-a691-4584-ab35-5a1e75829714 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7684f8e3-a691-4584-ab35-5a1e75829714';

-- Record: ee77a1de-357f-4e69-82cc-cd9a77f47ef9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ee77a1de-357f-4e69-82cc-cd9a77f47ef9';

-- Record: 7b715d26-eda6-4b8b-a97c-153225387337 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7b715d26-eda6-4b8b-a97c-153225387337';

-- Record: fe5b792f-7e89-4ffb-932c-38c8fdba6acc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fe5b792f-7e89-4ffb-932c-38c8fdba6acc';

-- Record: 50ca0ca4-172f-4d3d-be1d-03e688ab1a02 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '50ca0ca4-172f-4d3d-be1d-03e688ab1a02';

-- Record: f4766bd9-3b79-4949-b5e8-a95760843333 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f4766bd9-3b79-4949-b5e8-a95760843333';

-- Record: 70cc3061-5660-40e1-825c-7a3807bc04ac (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '70cc3061-5660-40e1-825c-7a3807bc04ac';

-- Record: 11775628-5884-44fe-b776-bd420d7daa62 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '11775628-5884-44fe-b776-bd420d7daa62';

-- Record: 087e294d-7ca5-4afa-9249-8125ab9a26cb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '087e294d-7ca5-4afa-9249-8125ab9a26cb';

-- Record: a8b58e0a-11b6-460b-9126-d6abe5e5657d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a8b58e0a-11b6-460b-9126-d6abe5e5657d';

-- Record: 44bdf551-77de-4f6a-bf32-fcd4e5539725 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '44bdf551-77de-4f6a-bf32-fcd4e5539725';

-- Record: fd2f8ac9-bf0f-4cf3-b1c8-ef01f624fb4b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fd2f8ac9-bf0f-4cf3-b1c8-ef01f624fb4b';

-- Record: 60481d52-486a-4e20-8790-a8653b4798ca (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '60481d52-486a-4e20-8790-a8653b4798ca';

-- Record: 9b18b752-2041-4290-87ac-9b301fc09b1d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9b18b752-2041-4290-87ac-9b301fc09b1d';

-- Record: 6659678c-770b-4813-aa80-a8ecff06219c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6659678c-770b-4813-aa80-a8ecff06219c';

-- Record: 579124f3-d668-4081-b0c7-74e2f0d8c45e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '579124f3-d668-4081-b0c7-74e2f0d8c45e';

-- Record: 1d29fa41-152f-4b4f-a989-ecec7bb41dc7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1d29fa41-152f-4b4f-a989-ecec7bb41dc7';

-- Record: d7e7a1d9-049b-419d-be09-6660988677e9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd7e7a1d9-049b-419d-be09-6660988677e9';

-- Record: 45420a41-f6e5-43f3-b590-28116031fe0b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '45420a41-f6e5-43f3-b590-28116031fe0b';

-- Record: aa922b3f-9f47-4a4f-b881-4a33bce7e939 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'aa922b3f-9f47-4a4f-b881-4a33bce7e939';

-- Record: de62e397-024c-4cfc-9b4e-884e79b0f13c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'de62e397-024c-4cfc-9b4e-884e79b0f13c';

-- Record: 11578052-517c-44b5-aad7-d6114f6707b6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '11578052-517c-44b5-aad7-d6114f6707b6';

-- Record: 8e4ec7cd-8880-4fef-9872-21876a80db54 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8e4ec7cd-8880-4fef-9872-21876a80db54';

-- Record: 8eff4c0a-100d-4cd2-a427-7cfa67132843 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8eff4c0a-100d-4cd2-a427-7cfa67132843';

-- Record: ede26985-f22a-442b-b369-025ac73d8809 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ede26985-f22a-442b-b369-025ac73d8809';

-- Record: b65b176d-5d4a-4c24-a342-9204c570ae3a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b65b176d-5d4a-4c24-a342-9204c570ae3a';

-- Record: d1739a7f-1c5c-498a-b489-d4c9be45a52a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd1739a7f-1c5c-498a-b489-d4c9be45a52a';

-- Record: 93816c37-3446-4640-80b2-b0555511d7a5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '93816c37-3446-4640-80b2-b0555511d7a5';

-- Record: 288a047a-344f-4e2e-bb58-490fe7976262 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '288a047a-344f-4e2e-bb58-490fe7976262';

-- Record: fbd6dca9-d332-481b-9a70-16e8d5c10cac (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fbd6dca9-d332-481b-9a70-16e8d5c10cac';

-- Record: 859499e8-894c-4f2f-b4f0-045903010315 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '859499e8-894c-4f2f-b4f0-045903010315';

-- Record: c3953075-629f-4d55-b625-d47a0718219a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c3953075-629f-4d55-b625-d47a0718219a';

-- Record: a3f42663-9530-4ed2-9325-f053be3a3ac5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a3f42663-9530-4ed2-9325-f053be3a3ac5';

-- Record: c91ba6f2-3b1c-47ef-8cbf-1894e4db2d9f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c91ba6f2-3b1c-47ef-8cbf-1894e4db2d9f';

-- Record: 52189c93-3f38-459d-aed3-0815dd4531b0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '52189c93-3f38-459d-aed3-0815dd4531b0';

-- Record: b517aae1-40fe-4433-b413-a2a33f5f9be9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b517aae1-40fe-4433-b413-a2a33f5f9be9';

-- Record: 264a7456-ded3-4041-8004-24de8e905a47 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '264a7456-ded3-4041-8004-24de8e905a47';

-- Record: 3d9b276b-f52c-439e-93e4-1b120d25d83d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3d9b276b-f52c-439e-93e4-1b120d25d83d';

-- Record: 3b6aa2c1-0864-4ad5-b36b-40cb84ce723a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3b6aa2c1-0864-4ad5-b36b-40cb84ce723a';

-- Record: 37f105d3-d5a2-4a09-9247-848f96e1e42f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '37f105d3-d5a2-4a09-9247-848f96e1e42f';

-- Record: 04e1f4b3-90be-40c2-8df6-7860591bae7e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '04e1f4b3-90be-40c2-8df6-7860591bae7e';

-- Record: 9aa0ff1b-3af6-4ed0-a52d-3dc0a13977ae (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9aa0ff1b-3af6-4ed0-a52d-3dc0a13977ae';

-- Record: 641129d4-c66e-4595-9c9a-5937651172a2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '641129d4-c66e-4595-9c9a-5937651172a2';

-- Record: 95033cfd-b7c2-4246-b558-080dad4fe05f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '95033cfd-b7c2-4246-b558-080dad4fe05f';

-- Record: 5e9c00d7-c355-4c3c-9f36-3d5c793a5351 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5e9c00d7-c355-4c3c-9f36-3d5c793a5351';

-- Record: c9382db6-d93b-4d3b-ae09-d76dba791509 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c9382db6-d93b-4d3b-ae09-d76dba791509';

-- Record: 3294c275-f16a-4a49-afe0-e4119c887c55 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3294c275-f16a-4a49-afe0-e4119c887c55';

-- Record: b39f1893-494a-4bf0-9ad5-5b274ca21e5e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b39f1893-494a-4bf0-9ad5-5b274ca21e5e';

-- Record: 8061ff06-5b32-4c45-bc1c-d36568d1b9d0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8061ff06-5b32-4c45-bc1c-d36568d1b9d0';

-- Record: bfa2e76b-508d-4063-b108-777a481dec58 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bfa2e76b-508d-4063-b108-777a481dec58';

-- Record: 70a84450-1635-4281-8e94-39d621237ab2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '70a84450-1635-4281-8e94-39d621237ab2';

-- Record: 14d678a0-3801-4f69-9414-bed0ef278ebc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '14d678a0-3801-4f69-9414-bed0ef278ebc';

-- Record: ea02446f-6c63-4f82-9fad-a0b71895b834 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ea02446f-6c63-4f82-9fad-a0b71895b834';

-- Record: 8c9331cd-c525-4382-a6be-5ee101f18822 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8c9331cd-c525-4382-a6be-5ee101f18822';

-- Record: 83446291-0bdc-4feb-aea6-61ee608bf8a3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '83446291-0bdc-4feb-aea6-61ee608bf8a3';

-- Record: 59648faf-c443-4788-8385-0024a0036aaf (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '59648faf-c443-4788-8385-0024a0036aaf';

-- Record: 803720ee-9462-47ee-bae9-5f7b2054bc67 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '803720ee-9462-47ee-bae9-5f7b2054bc67';

-- Record: 28452255-7388-47fe-a5bc-ed31fd6bd7f5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '28452255-7388-47fe-a5bc-ed31fd6bd7f5';

-- Record: ea609867-f426-4d54-ad67-f03b5685301c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ea609867-f426-4d54-ad67-f03b5685301c';

-- Record: b35e2ddf-6f1b-42f6-9eb7-c76172bcac53 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b35e2ddf-6f1b-42f6-9eb7-c76172bcac53';

-- Record: 7ed00889-c06f-4a3d-875a-54bf25df42dc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7ed00889-c06f-4a3d-875a-54bf25df42dc';

-- Record: 64a3c048-9947-49dc-a9e3-af631b1b5c49 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '64a3c048-9947-49dc-a9e3-af631b1b5c49';

-- Record: beb85e81-3e30-416b-ac83-0b9f59a905b7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'beb85e81-3e30-416b-ac83-0b9f59a905b7';

-- Record: 736e023c-c7b1-4043-bfa0-716b128acde4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '736e023c-c7b1-4043-bfa0-716b128acde4';

-- Record: 86e832c0-dcd3-4d97-bfdf-d3ebacfc5b27 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '86e832c0-dcd3-4d97-bfdf-d3ebacfc5b27';

-- Record: da6ea3e6-7adf-4bc2-a5bc-eae6363c9dbc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'da6ea3e6-7adf-4bc2-a5bc-eae6363c9dbc';

-- Record: 5817c2ac-c812-4aef-9352-523faa1dac7a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5817c2ac-c812-4aef-9352-523faa1dac7a';

-- Record: 9f99df7f-b20e-4f5f-9b66-ef3a94962c48 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9f99df7f-b20e-4f5f-9b66-ef3a94962c48';

-- Record: 98c53493-7b35-4070-a02d-959fcf03e353 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '98c53493-7b35-4070-a02d-959fcf03e353';

-- Record: 030dd345-9c12-4b0d-9235-ccc0b3d1be27 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '030dd345-9c12-4b0d-9235-ccc0b3d1be27';

-- Record: 37903da5-75c7-409c-a1aa-46dc7848b37a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '37903da5-75c7-409c-a1aa-46dc7848b37a';

-- Record: c5d8fc2a-12af-4217-86ea-4a5be9a1da0f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c5d8fc2a-12af-4217-86ea-4a5be9a1da0f';

-- Record: 2cc83639-e237-46db-b5b6-bf90ef5b6043 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2cc83639-e237-46db-b5b6-bf90ef5b6043';

-- Record: 690ca658-c547-46b5-8f1a-e8a8af31efe8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '690ca658-c547-46b5-8f1a-e8a8af31efe8';

-- Record: 37f08363-f665-4204-8035-e8867285a823 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '37f08363-f665-4204-8035-e8867285a823';

-- Record: 4f01c8e8-32d7-4126-9344-cc01613730db (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4f01c8e8-32d7-4126-9344-cc01613730db';

-- Record: a493a597-4050-4ee2-8fb2-5e38c9e9eb3e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a493a597-4050-4ee2-8fb2-5e38c9e9eb3e';

-- Record: d47866dc-f271-40cc-a93e-fcebde0fb579 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd47866dc-f271-40cc-a93e-fcebde0fb579';

-- Record: de3e637c-25cd-48d1-a0be-6d894e864417 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'de3e637c-25cd-48d1-a0be-6d894e864417';

-- Record: ad77cf00-1c39-4432-99e9-fe81c8e8d509 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ad77cf00-1c39-4432-99e9-fe81c8e8d509';

-- Record: 8c7255f7-eca8-48a6-b1f6-9945b60ff2d5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8c7255f7-eca8-48a6-b1f6-9945b60ff2d5';

-- Record: 2bb477f8-42da-48d4-b4c5-60f186ea929f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2bb477f8-42da-48d4-b4c5-60f186ea929f';

-- Record: 6a102db0-b036-4e0c-8286-aa423e87079d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6a102db0-b036-4e0c-8286-aa423e87079d';

-- Record: f09a1148-a3a2-4bfa-a928-f800efb4f779 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f09a1148-a3a2-4bfa-a928-f800efb4f779';

-- Record: a737565a-581f-4b54-95f1-5a4e7d18fd1a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a737565a-581f-4b54-95f1-5a4e7d18fd1a';

-- Record: ca39827d-84f4-40ce-8ce1-9d6d42f3dfba (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ca39827d-84f4-40ce-8ce1-9d6d42f3dfba';

-- Record: 8e5cd018-31be-4d4b-8ce0-448dde530e89 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8e5cd018-31be-4d4b-8ce0-448dde530e89';

-- Record: aff6bd42-ad9b-48e5-9eaa-a97d1d5bc6c3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'aff6bd42-ad9b-48e5-9eaa-a97d1d5bc6c3';

-- Record: f2b2460f-f8fa-421c-9f0e-145abbcaccb6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f2b2460f-f8fa-421c-9f0e-145abbcaccb6';

-- Record: 7fdb59a9-fad5-493e-be70-56167a153b99 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7fdb59a9-fad5-493e-be70-56167a153b99';

-- Record: bbf185ab-c440-48d5-8a3a-43838897c30f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bbf185ab-c440-48d5-8a3a-43838897c30f';

-- Record: 8679c9f2-9a99-4373-82b6-1f03dc022324 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8679c9f2-9a99-4373-82b6-1f03dc022324';

-- Record: 455ce299-de4f-4dd4-b0b9-09f62afbc932 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '455ce299-de4f-4dd4-b0b9-09f62afbc932';

-- Record: 5ff76854-deb7-47a4-86e3-dbc0341bb01c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5ff76854-deb7-47a4-86e3-dbc0341bb01c';

-- Record: 5e8c4464-8502-44a2-aeee-4c534139891d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5e8c4464-8502-44a2-aeee-4c534139891d';

-- Record: 92ccc0d6-3ed8-463f-bc6a-0c7e7faf0bf6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '92ccc0d6-3ed8-463f-bc6a-0c7e7faf0bf6';

-- Record: 4b2ad5fa-7769-4bec-9d8b-6fc94a73951b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4b2ad5fa-7769-4bec-9d8b-6fc94a73951b';

-- Record: 8584ded6-74d1-4a2d-98b1-928032cb6603 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8584ded6-74d1-4a2d-98b1-928032cb6603';

-- Record: ef616258-4be9-4cd5-ac64-2512c8f4366d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ef616258-4be9-4cd5-ac64-2512c8f4366d';

-- Record: 89d1cac0-15f5-42fd-bc64-8284ed64bc1b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '89d1cac0-15f5-42fd-bc64-8284ed64bc1b';

-- Record: e5eaa1be-7829-41ff-93da-110b6477e96b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e5eaa1be-7829-41ff-93da-110b6477e96b';

-- Record: 32c6ff7c-fafd-4ebe-b204-1d676eaae19f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '32c6ff7c-fafd-4ebe-b204-1d676eaae19f';

-- Record: 49e644df-5235-4e09-ab5e-61a745b35285 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '49e644df-5235-4e09-ab5e-61a745b35285';

-- Record: 2e57ae76-7479-482d-ac6e-413b833a63a2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2e57ae76-7479-482d-ac6e-413b833a63a2';

-- Record: b4606651-a4f7-4eab-adc9-eba98683a3b2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b4606651-a4f7-4eab-adc9-eba98683a3b2';

-- Record: 8d1b73ea-06d3-492b-a1ca-d52070cb3380 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8d1b73ea-06d3-492b-a1ca-d52070cb3380';

-- Record: 6516ee24-76d6-4c83-839d-95f552e4c33c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6516ee24-76d6-4c83-839d-95f552e4c33c';

-- Record: f415df2f-de08-4a7a-be76-d7367ab52156 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f415df2f-de08-4a7a-be76-d7367ab52156';

-- Record: 4a66884c-11fc-41f4-99cd-5195ac731520 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4a66884c-11fc-41f4-99cd-5195ac731520';

-- Record: c18ed491-766b-44cc-88cf-aaccbc4adfd6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c18ed491-766b-44cc-88cf-aaccbc4adfd6';

-- Record: 2948e2d5-d5fd-495f-9973-8dc2d940c5c4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2948e2d5-d5fd-495f-9973-8dc2d940c5c4';

-- Record: 23864f6e-27a8-4c04-9092-10d3aeb3ee82 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '23864f6e-27a8-4c04-9092-10d3aeb3ee82';

-- Record: 9250c1d1-0460-4bef-8088-674785b78e50 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9250c1d1-0460-4bef-8088-674785b78e50';

-- Record: 24ec3024-1fa1-4e31-82dc-70fc03922a4e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '24ec3024-1fa1-4e31-82dc-70fc03922a4e';

-- Record: 508467a3-ba84-4a26-a044-b39fb44d02f1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '508467a3-ba84-4a26-a044-b39fb44d02f1';

-- Record: cb96624d-469f-45a7-833f-0e6f4e661ed0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cb96624d-469f-45a7-833f-0e6f4e661ed0';

-- Record: f095f30c-e7c2-4dc4-923b-f34748819ea0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f095f30c-e7c2-4dc4-923b-f34748819ea0';

-- Record: 1c9d1d38-667a-4483-af09-b29f4b045b05 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1c9d1d38-667a-4483-af09-b29f4b045b05';

-- Record: 48615325-0f55-4e25-9094-acfdf9e02a93 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '48615325-0f55-4e25-9094-acfdf9e02a93';

-- Record: e741f5b0-035f-4a07-bf29-298ab2a26c1b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e741f5b0-035f-4a07-bf29-298ab2a26c1b';

-- Record: 530de43f-98fc-4d3e-950e-0fd44646670f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '530de43f-98fc-4d3e-950e-0fd44646670f';

-- Record: 98b7469e-d9b6-4e1a-976f-aebbd77b6036 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '98b7469e-d9b6-4e1a-976f-aebbd77b6036';

-- Record: c8117db7-8f40-4146-9d73-1d9c99d86123 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c8117db7-8f40-4146-9d73-1d9c99d86123';

-- Record: d9d446bd-3078-47ee-83e2-ff32317d1a3e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd9d446bd-3078-47ee-83e2-ff32317d1a3e';

-- Record: b5e52ee7-4daa-46ab-aeed-9442a3cc10eb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b5e52ee7-4daa-46ab-aeed-9442a3cc10eb';

-- Record: 390fd7fe-1fb7-4f72-89c5-b7e517fc1bd6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '390fd7fe-1fb7-4f72-89c5-b7e517fc1bd6';

-- Record: 5a04f9be-6606-46ce-a8ed-c076190bdba0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5a04f9be-6606-46ce-a8ed-c076190bdba0';

-- Record: 3ecf7669-5013-4323-82cf-7b02fcd17b17 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3ecf7669-5013-4323-82cf-7b02fcd17b17';

-- Record: f211850b-752d-4b22-aba9-d2d0c80b5446 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f211850b-752d-4b22-aba9-d2d0c80b5446';

-- Record: 479bd67e-9d99-4fe5-ac46-cdb1114c026e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '479bd67e-9d99-4fe5-ac46-cdb1114c026e';

-- Record: 2f02a0e6-a9aa-491c-b2c6-e0c6ee5d70db (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2f02a0e6-a9aa-491c-b2c6-e0c6ee5d70db';

-- Record: c4d45053-47e1-40b4-8a38-7afb2c945870 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c4d45053-47e1-40b4-8a38-7afb2c945870';

-- Record: d91c2b41-bee3-496f-b258-3c5f028d642d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd91c2b41-bee3-496f-b258-3c5f028d642d';

-- Record: 04448f01-8aeb-4a8f-b110-48f2ada116a8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '04448f01-8aeb-4a8f-b110-48f2ada116a8';

-- Record: 911dca7c-c34d-4dbe-97d9-0f5f07e91d1e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '911dca7c-c34d-4dbe-97d9-0f5f07e91d1e';

-- Record: 2d03a5ae-1715-4d3d-9500-23864fcf6e72 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2d03a5ae-1715-4d3d-9500-23864fcf6e72';

-- Record: 49eef620-f3ac-4bf7-a395-180d8ac62c74 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '49eef620-f3ac-4bf7-a395-180d8ac62c74';

-- Record: 161e8781-c5cc-4794-be9f-9d406784e699 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '161e8781-c5cc-4794-be9f-9d406784e699';

-- Record: a488a772-c2d6-4ff0-87a7-a397446e1685 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a488a772-c2d6-4ff0-87a7-a397446e1685';

-- Record: 6c3ab576-9832-4f66-bb39-a6c0b671c337 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6c3ab576-9832-4f66-bb39-a6c0b671c337';

-- Record: a56f2257-1166-4668-8ca0-e74623815503 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a56f2257-1166-4668-8ca0-e74623815503';

-- Record: 16326922-6ad3-4708-a3b2-ea84f3903707 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '16326922-6ad3-4708-a3b2-ea84f3903707';

-- Record: a444e72d-2eb1-4713-a681-f8a45f37ed9f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a444e72d-2eb1-4713-a681-f8a45f37ed9f';

-- Record: 77520425-6aff-4868-a2bb-386906266bf5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '77520425-6aff-4868-a2bb-386906266bf5';

-- Record: b037aa13-ff83-4db0-a243-f02a7d66dd32 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b037aa13-ff83-4db0-a243-f02a7d66dd32';

-- Record: f334c89e-0104-49c7-8238-06d62c2ab804 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f334c89e-0104-49c7-8238-06d62c2ab804';

-- Record: 22645dbe-63f3-4ef7-aac9-e823d47a6539 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '22645dbe-63f3-4ef7-aac9-e823d47a6539';

-- Record: 895dbb90-0bc7-4371-a156-af369ad24225 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '895dbb90-0bc7-4371-a156-af369ad24225';

-- Record: b3d0a96f-9914-4eb7-9f03-65423ea5e610 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b3d0a96f-9914-4eb7-9f03-65423ea5e610';

-- Record: a8d6047d-2572-4d81-b681-d1fb3f2d5e5b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a8d6047d-2572-4d81-b681-d1fb3f2d5e5b';

-- Record: 62cc4e0e-f814-4911-af90-1d1fc5c2dd24 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '62cc4e0e-f814-4911-af90-1d1fc5c2dd24';

-- Record: 5f3e55a2-0488-47df-961e-a06e4b7da584 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5f3e55a2-0488-47df-961e-a06e4b7da584';

-- Record: 782f5692-7f33-48a1-b242-c299114cb15c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '782f5692-7f33-48a1-b242-c299114cb15c';

-- Record: d97ebd60-f532-4eaa-8e15-84d24d9b656e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd97ebd60-f532-4eaa-8e15-84d24d9b656e';

-- Record: 34ce254b-da59-4d08-b16f-4635ed142573 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '34ce254b-da59-4d08-b16f-4635ed142573';

-- Record: 682db85d-015f-46ae-8e11-000f82ce6d5c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '682db85d-015f-46ae-8e11-000f82ce6d5c';

-- Record: b38005d3-0d66-4f96-a65a-2aad7bed8349 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b38005d3-0d66-4f96-a65a-2aad7bed8349';

-- Record: cddf5e18-41eb-4001-a343-8002d8ffa88c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cddf5e18-41eb-4001-a343-8002d8ffa88c';

-- Record: 8c4fc8e8-5f45-473c-bba8-d7f2e03301a6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8c4fc8e8-5f45-473c-bba8-d7f2e03301a6';

-- Record: 8009ad88-6b46-4412-a465-99acd03052ac (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8009ad88-6b46-4412-a465-99acd03052ac';

-- Record: 193c8e62-cc25-4885-a4d5-5438e26ac66c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '193c8e62-cc25-4885-a4d5-5438e26ac66c';

-- Record: 07872617-abbf-4689-a8b3-bf3076f62d13 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '07872617-abbf-4689-a8b3-bf3076f62d13';

-- Record: a34cc831-eff1-4cd7-ba6c-1573c54fedd1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a34cc831-eff1-4cd7-ba6c-1573c54fedd1';

-- Record: d7ec236f-395a-4510-884d-74966b428d99 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd7ec236f-395a-4510-884d-74966b428d99';

-- Record: fb505c6c-9a24-49e0-b38b-1bac7a3cc97d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fb505c6c-9a24-49e0-b38b-1bac7a3cc97d';

-- Record: 2fd9c417-fc7a-498f-9327-8e48e5cb496a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2fd9c417-fc7a-498f-9327-8e48e5cb496a';

-- Record: 66e36ead-bf8f-4fde-840e-8fe99d40b84c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '66e36ead-bf8f-4fde-840e-8fe99d40b84c';

-- Record: eb488b55-9851-4715-980d-386c3da88a85 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'eb488b55-9851-4715-980d-386c3da88a85';

-- Record: 4d9230b5-a361-421e-af87-eefd1b154dd1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4d9230b5-a361-421e-af87-eefd1b154dd1';

-- Record: f1d5b3be-1294-44f0-a1e6-97044e45b40b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f1d5b3be-1294-44f0-a1e6-97044e45b40b';

-- Record: 16edb424-c24f-4719-9e7c-42c0dfa426fe (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '16edb424-c24f-4719-9e7c-42c0dfa426fe';

-- Record: 6693ed11-43dc-4035-8e19-1f0ca710aff0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6693ed11-43dc-4035-8e19-1f0ca710aff0';

-- Record: b563b372-a671-4f43-9627-67f69ed9cfcd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b563b372-a671-4f43-9627-67f69ed9cfcd';

-- Record: 5e636287-aad8-4a30-a54e-407b8f2617e3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5e636287-aad8-4a30-a54e-407b8f2617e3';

-- Record: 48085ed6-512f-47b3-869b-abf0e34e3db1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '48085ed6-512f-47b3-869b-abf0e34e3db1';

-- Record: 21ae9dbf-f7c6-4222-be11-46d800c64b6d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '21ae9dbf-f7c6-4222-be11-46d800c64b6d';

-- Record: 83883a95-1957-417a-847b-d3ddb6ada379 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '83883a95-1957-417a-847b-d3ddb6ada379';

-- Record: ad51bcb0-8a4d-4129-99ad-d9b1baaf82d4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ad51bcb0-8a4d-4129-99ad-d9b1baaf82d4';

-- Record: 90848c4c-4aa0-478d-8a9c-4046d3b43332 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '90848c4c-4aa0-478d-8a9c-4046d3b43332';

-- Record: ce307bab-08ed-451d-b688-04e7a8504d41 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ce307bab-08ed-451d-b688-04e7a8504d41';

-- Record: 54fdb64a-5dbe-4a03-ab11-245375f6f613 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '54fdb64a-5dbe-4a03-ab11-245375f6f613';

-- Record: 433b9917-810f-4d48-9c03-1d72669853e0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '433b9917-810f-4d48-9c03-1d72669853e0';

-- Record: 327d3446-c859-45f2-9f96-44fe2e45c4f4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '327d3446-c859-45f2-9f96-44fe2e45c4f4';

-- Record: 05f8e912-c479-4ee2-876c-dd2a23c9a714 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '05f8e912-c479-4ee2-876c-dd2a23c9a714';

-- Record: f2c8aaf5-82df-4d11-9e37-89831f4a457f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f2c8aaf5-82df-4d11-9e37-89831f4a457f';

-- Record: cd28474c-cc5d-41ee-bf59-c83f565a3b91 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cd28474c-cc5d-41ee-bf59-c83f565a3b91';

-- Record: 2c122289-5f25-4c74-b585-3874e1ffaa9e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2c122289-5f25-4c74-b585-3874e1ffaa9e';

-- Record: bcfa0df1-cef3-4b3f-bc43-2f6f49284393 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bcfa0df1-cef3-4b3f-bc43-2f6f49284393';

-- Record: cce21e82-68dc-43ea-861f-bde01ef69b16 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cce21e82-68dc-43ea-861f-bde01ef69b16';

-- Record: 8a9c4612-fc46-44a4-aae0-bca94c46dedf (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8a9c4612-fc46-44a4-aae0-bca94c46dedf';

-- Record: 5e58ea4a-e2fd-49cd-a378-90c15fa03736 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5e58ea4a-e2fd-49cd-a378-90c15fa03736';

-- Record: 6143bce0-d1a7-450d-97e3-8c1e3a11584b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6143bce0-d1a7-450d-97e3-8c1e3a11584b';

-- Record: 9a5fb606-5584-4d4e-a624-b8c54e4ba39b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9a5fb606-5584-4d4e-a624-b8c54e4ba39b';

-- Record: 2d4c22a3-2502-4e06-bcf1-d8005a4b8811 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2d4c22a3-2502-4e06-bcf1-d8005a4b8811';

-- Record: 97875137-e81e-450c-8193-9f6f0574b107 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '97875137-e81e-450c-8193-9f6f0574b107';

-- Record: db4f4d52-7730-4e96-87c2-11820b8f5a60 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'db4f4d52-7730-4e96-87c2-11820b8f5a60';

-- Record: b1635de2-3338-4b8f-a311-867f7bd2e95a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b1635de2-3338-4b8f-a311-867f7bd2e95a';

-- Record: cd752e6a-42b6-4b8b-80bb-fd88c357307e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cd752e6a-42b6-4b8b-80bb-fd88c357307e';

-- Record: 01eac3b7-c947-4cc6-810b-c703bec6bfc5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '01eac3b7-c947-4cc6-810b-c703bec6bfc5';

-- Record: 0aa67657-ccfb-4060-a75a-8c8bb4183a7c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0aa67657-ccfb-4060-a75a-8c8bb4183a7c';

-- Record: 2d89e0f7-09b7-47f7-a6ab-53f162eae006 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2d89e0f7-09b7-47f7-a6ab-53f162eae006';

-- Record: 117ea863-4313-4a40-a3a1-0bf2ab6b58c2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '117ea863-4313-4a40-a3a1-0bf2ab6b58c2';

-- Record: 0c193386-3ac9-45ca-8320-fb0d2b68d9ad (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0c193386-3ac9-45ca-8320-fb0d2b68d9ad';

-- Record: 2912a1d0-eac7-4887-8230-65fc414ef48b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2912a1d0-eac7-4887-8230-65fc414ef48b';

-- Record: f1a3f5e3-3793-4fca-8f98-44af08cf8bba (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f1a3f5e3-3793-4fca-8f98-44af08cf8bba';

-- Record: 4859fc6e-0742-464c-8b2f-bcbded4d74ce (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4859fc6e-0742-464c-8b2f-bcbded4d74ce';

-- Record: ccfc0a67-d146-4a75-8c49-8813d562c120 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ccfc0a67-d146-4a75-8c49-8813d562c120';

-- Record: 4e3862da-848c-4bc5-9efa-4646255a0e9a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4e3862da-848c-4bc5-9efa-4646255a0e9a';

-- Record: e1d3cdfb-0c43-44b2-82cd-e79611dee075 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e1d3cdfb-0c43-44b2-82cd-e79611dee075';

-- Record: b539e15a-f782-41a7-9f81-68d717dd13a0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b539e15a-f782-41a7-9f81-68d717dd13a0';

-- Record: 02e07147-29eb-49d3-bd3a-f66181810c03 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '02e07147-29eb-49d3-bd3a-f66181810c03';

-- Record: 87fa70d2-ee34-4283-b0b7-8626b59294ea (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '87fa70d2-ee34-4283-b0b7-8626b59294ea';

-- Record: 6f4dffb4-11ce-45e1-8988-911312af2ed9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6f4dffb4-11ce-45e1-8988-911312af2ed9';

-- Record: 72d14d3c-f133-4ad6-b7bd-206646cbaf34 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '72d14d3c-f133-4ad6-b7bd-206646cbaf34';

-- Record: 61607141-0034-441f-82ed-41f1e4365192 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '61607141-0034-441f-82ed-41f1e4365192';

-- Record: 115d8ce3-1171-464f-bd4d-62c984da9797 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '115d8ce3-1171-464f-bd4d-62c984da9797';

-- Record: d68b56f8-19bb-454e-995b-fde2ce219dd8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd68b56f8-19bb-454e-995b-fde2ce219dd8';

-- Record: 70237c4b-ec74-4935-a172-b535e97752e2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '70237c4b-ec74-4935-a172-b535e97752e2';

-- Record: 179675ba-9c39-4621-9c86-b32a5ef3bbc8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '179675ba-9c39-4621-9c86-b32a5ef3bbc8';

-- Record: 2256c95d-9868-48e2-b3f4-652427ab64a8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2256c95d-9868-48e2-b3f4-652427ab64a8';

-- Record: c5d922d1-c6a2-4471-90fb-fb1c69864610 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c5d922d1-c6a2-4471-90fb-fb1c69864610';

-- Record: da761f4f-ba2e-4374-9ccb-44b082b74153 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'da761f4f-ba2e-4374-9ccb-44b082b74153';

-- Record: d6714659-7055-47ca-a67d-8200c848c5e0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd6714659-7055-47ca-a67d-8200c848c5e0';

-- Record: 23949e37-2152-4315-a88f-6cc87bdd694e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '23949e37-2152-4315-a88f-6cc87bdd694e';

-- Record: a9154938-f5d7-48c1-9d2e-2a04973775ff (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a9154938-f5d7-48c1-9d2e-2a04973775ff';

-- Record: fb78ea6c-5811-405e-8735-f3328b1bfc50 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fb78ea6c-5811-405e-8735-f3328b1bfc50';

-- Record: 4ae4a79a-f583-4740-b92a-7d6b30796d73 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4ae4a79a-f583-4740-b92a-7d6b30796d73';

-- Record: 70ff387b-6921-4c21-8bbf-9f8895975d1e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '70ff387b-6921-4c21-8bbf-9f8895975d1e';

-- Record: c1b9bdb3-41f0-4753-909d-120648eb3c51 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c1b9bdb3-41f0-4753-909d-120648eb3c51';

-- Record: 7885337b-84e2-420e-8581-eef7d4276e9f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7885337b-84e2-420e-8581-eef7d4276e9f';

-- Record: 319515de-c426-479a-b424-a624ef9b68af (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '319515de-c426-479a-b424-a624ef9b68af';

-- Record: ef973af2-825d-48c1-8ae5-91b8e21af65a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ef973af2-825d-48c1-8ae5-91b8e21af65a';

-- Record: 9ed73ac0-7f12-44f9-b537-f6541db49d1c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9ed73ac0-7f12-44f9-b537-f6541db49d1c';

-- Record: 7a21b2c9-f179-4ad6-b009-05e75b490601 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7a21b2c9-f179-4ad6-b009-05e75b490601';

-- Record: 24f44ae1-ff35-4c0a-9cee-15f793a2d9ea (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '24f44ae1-ff35-4c0a-9cee-15f793a2d9ea';

-- Record: 68713ac9-72c3-4454-ac10-1c5eadf039e0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '68713ac9-72c3-4454-ac10-1c5eadf039e0';

-- Record: c32fbe40-9259-4488-84b0-530f1568a69f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c32fbe40-9259-4488-84b0-530f1568a69f';

-- Record: b8514f80-6800-4a01-b25b-833e1ec97133 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b8514f80-6800-4a01-b25b-833e1ec97133';

-- Record: 3833ae6f-4676-4fd0-8035-e96fd4ca0063 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3833ae6f-4676-4fd0-8035-e96fd4ca0063';

-- Record: 1b0d68cb-7a32-413f-8b96-3d5a9a6231d7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1b0d68cb-7a32-413f-8b96-3d5a9a6231d7';

-- Record: ec077f3a-e6cc-494f-afc9-d85df5c31a42 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ec077f3a-e6cc-494f-afc9-d85df5c31a42';

-- Record: a8193055-b146-4d61-891a-9abbe03da707 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a8193055-b146-4d61-891a-9abbe03da707';

-- Record: a9d5861c-8dd8-4454-9c02-b463b8f09665 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a9d5861c-8dd8-4454-9c02-b463b8f09665';

-- Record: 3b3a5d3e-3e8b-4579-ae66-5d9a73af0634 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3b3a5d3e-3e8b-4579-ae66-5d9a73af0634';

-- Record: 3f0bbb7d-604e-485c-afe9-7073b799ead0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3f0bbb7d-604e-485c-afe9-7073b799ead0';

-- Record: 42b32998-e477-455b-8fe5-17371b1b326c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '42b32998-e477-455b-8fe5-17371b1b326c';

-- Record: acaf4a46-edd0-41d0-a638-ffa5c2170a84 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'acaf4a46-edd0-41d0-a638-ffa5c2170a84';

-- Record: b68a86d6-378b-4b91-b821-83d6bb45b933 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b68a86d6-378b-4b91-b821-83d6bb45b933';

-- Record: 5425a382-4d3a-4a75-b40d-24a85b48a6b6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5425a382-4d3a-4a75-b40d-24a85b48a6b6';

-- Record: 23260f44-f61f-4153-b892-d74f86ea5596 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '23260f44-f61f-4153-b892-d74f86ea5596';

-- Record: a6e5cd9b-1f20-49ec-9e5c-0d09b0f34e3a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a6e5cd9b-1f20-49ec-9e5c-0d09b0f34e3a';

-- Record: 840562d4-f6cf-407f-bcc4-e4d922e56507 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '840562d4-f6cf-407f-bcc4-e4d922e56507';

-- Record: fe101aab-6154-4594-aab1-433f0f97730a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fe101aab-6154-4594-aab1-433f0f97730a';

-- Record: 645b32b9-928a-48f0-9303-364410c4241a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '645b32b9-928a-48f0-9303-364410c4241a';

-- Record: babfec84-850f-4752-b6a8-415bdcfec0ed (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'babfec84-850f-4752-b6a8-415bdcfec0ed';

-- Record: 8788c674-bbe5-4d30-8686-03c5a99f43b0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8788c674-bbe5-4d30-8686-03c5a99f43b0';

-- Record: d486e83b-29c0-4f1c-b3b8-006e90384d88 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd486e83b-29c0-4f1c-b3b8-006e90384d88';

-- Record: d3396a73-a5ce-49e1-8e45-dcb3f5d621eb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd3396a73-a5ce-49e1-8e45-dcb3f5d621eb';

-- Record: 006bc214-b131-48b7-a0ea-ef5b455cfaa6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '006bc214-b131-48b7-a0ea-ef5b455cfaa6';

-- Record: ab3155de-2904-48a5-98f8-af6ffd85787e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ab3155de-2904-48a5-98f8-af6ffd85787e';

-- Record: 21ce710e-0d7e-4129-8a15-952cc8ec25c7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '21ce710e-0d7e-4129-8a15-952cc8ec25c7';

-- Record: 22f005c7-2b02-4322-8fc1-7182b5bb0354 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '22f005c7-2b02-4322-8fc1-7182b5bb0354';

-- Record: 2b4482e6-5d86-4464-912b-f0ae6b95140f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2b4482e6-5d86-4464-912b-f0ae6b95140f';

-- Record: e36092ce-42bc-480e-9552-e9885b0f998d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e36092ce-42bc-480e-9552-e9885b0f998d';

-- Record: 17df5162-004f-4e37-b23f-b175a50f106f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '17df5162-004f-4e37-b23f-b175a50f106f';

-- Record: 40e2b4ad-dc9a-4fe9-ac51-081444123468 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '40e2b4ad-dc9a-4fe9-ac51-081444123468';

-- Record: 7f3d7056-0752-4b1b-bbf3-9985f3fb5fcb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7f3d7056-0752-4b1b-bbf3-9985f3fb5fcb';

-- Record: 41cb4446-b7b3-48e0-856b-c2c896327c87 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '41cb4446-b7b3-48e0-856b-c2c896327c87';

-- Record: 5c575eb7-7e42-4fbc-a7fb-3c8ee8f022b6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5c575eb7-7e42-4fbc-a7fb-3c8ee8f022b6';

-- Record: ea7a1fa9-728f-4398-9463-fc73fa6c9ff1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ea7a1fa9-728f-4398-9463-fc73fa6c9ff1';

-- Record: 6a625505-01c1-46f4-93a5-c0b3a60b6014 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6a625505-01c1-46f4-93a5-c0b3a60b6014';

-- Record: c70e175b-670c-434e-88bc-264bebf146c2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c70e175b-670c-434e-88bc-264bebf146c2';

-- Record: 4b8f046f-edc2-44b5-b1db-6211bd6719bc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4b8f046f-edc2-44b5-b1db-6211bd6719bc';

-- Record: 1b17d11e-37b2-4dfa-895d-b83efbd13cad (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1b17d11e-37b2-4dfa-895d-b83efbd13cad';

-- Record: 9d91853b-685d-4cf4-bf2a-988a15ac0820 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9d91853b-685d-4cf4-bf2a-988a15ac0820';

-- Record: e94c54eb-a16e-4bdf-98b9-d18596d272c5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e94c54eb-a16e-4bdf-98b9-d18596d272c5';

-- Record: 72efad6d-9fca-4152-86ab-1630f3ea3a56 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '72efad6d-9fca-4152-86ab-1630f3ea3a56';

-- Record: e15e0f15-bc8d-4b3e-be10-3b4088036e45 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e15e0f15-bc8d-4b3e-be10-3b4088036e45';

-- Record: 15802eaa-4d10-4ec6-bedd-d414592aa2f2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '15802eaa-4d10-4ec6-bedd-d414592aa2f2';

-- Record: bad78366-69c4-4496-8040-7c2cec1fd112 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bad78366-69c4-4496-8040-7c2cec1fd112';

-- Record: b3d5215d-de83-4e25-ad2f-6d6d7ebe3883 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b3d5215d-de83-4e25-ad2f-6d6d7ebe3883';

-- Record: ff210cac-a718-4ab4-af63-75479a227e11 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ff210cac-a718-4ab4-af63-75479a227e11';

-- Record: 0ed2560c-a96d-4988-8865-c4c91d64390b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0ed2560c-a96d-4988-8865-c4c91d64390b';

-- Record: 48e696df-429e-4e3a-a110-bb65bb7a1fe2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '48e696df-429e-4e3a-a110-bb65bb7a1fe2';

-- Record: d1497a3e-1d3b-4ac8-aba7-774b0ad9c5bb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd1497a3e-1d3b-4ac8-aba7-774b0ad9c5bb';

-- Record: f9851461-d588-412d-9d63-986e63ab7433 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f9851461-d588-412d-9d63-986e63ab7433';

-- Record: 308cb036-c38d-4716-a8d7-643716263ce5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '308cb036-c38d-4716-a8d7-643716263ce5';

-- Record: beffc3a8-615d-48bc-9c15-8edea10a8bd4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'beffc3a8-615d-48bc-9c15-8edea10a8bd4';

-- Record: e308b5ad-c07b-4534-b4c4-0ee5f5ebeb93 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e308b5ad-c07b-4534-b4c4-0ee5f5ebeb93';

-- Record: 50773b61-713f-4806-b942-78671ea455fa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '50773b61-713f-4806-b942-78671ea455fa';

-- Record: 10d7d97d-e51c-4406-ab08-91fb2dbed1cc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '10d7d97d-e51c-4406-ab08-91fb2dbed1cc';

-- Record: cb94c7af-a333-4ec1-bc35-d852048e3ebd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cb94c7af-a333-4ec1-bc35-d852048e3ebd';

-- Record: 8001d900-858e-4040-80b7-4b6505213050 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8001d900-858e-4040-80b7-4b6505213050';

-- Record: ab977549-4d01-4924-8b3a-98038479cd50 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ab977549-4d01-4924-8b3a-98038479cd50';

-- Record: b2608e21-78ad-4bc5-80b8-e2f9f6b86b46 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b2608e21-78ad-4bc5-80b8-e2f9f6b86b46';

-- Record: 50fec5bb-c848-4702-af53-a2a884b34081 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '50fec5bb-c848-4702-af53-a2a884b34081';

-- Record: a296ad2b-f57f-4d04-b536-18c8605e4b91 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a296ad2b-f57f-4d04-b536-18c8605e4b91';

-- Record: 52786788-89e8-41f0-9379-99cdde965c37 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '52786788-89e8-41f0-9379-99cdde965c37';

-- Record: b6c7a1f4-384b-431c-a6e8-80d2cd8db443 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b6c7a1f4-384b-431c-a6e8-80d2cd8db443';

-- Record: 54922d53-0031-4602-8402-0dab46caa202 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '54922d53-0031-4602-8402-0dab46caa202';

-- Record: d79b702a-6c03-46fd-88e3-f98a96a51046 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd79b702a-6c03-46fd-88e3-f98a96a51046';

-- Record: f9b25853-8283-4e59-a6f4-8b92976a546a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f9b25853-8283-4e59-a6f4-8b92976a546a';

-- Record: 1bf3f858-35e2-4767-b15b-55b8eb89794a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1bf3f858-35e2-4767-b15b-55b8eb89794a';

-- Record: 698e0301-8df1-465b-becf-965706af1125 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '698e0301-8df1-465b-becf-965706af1125';

-- Record: 7812313a-c2e6-43e0-a5b2-950be78ceaea (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7812313a-c2e6-43e0-a5b2-950be78ceaea';

-- Record: ef433003-606a-4367-b14e-37d1e712e0aa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ef433003-606a-4367-b14e-37d1e712e0aa';

-- Record: ac700076-9c6f-44b9-a5ce-b3952d5b6631 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ac700076-9c6f-44b9-a5ce-b3952d5b6631';

-- Record: e5e69ba8-19dd-4d4a-a0db-9879a85d124a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e5e69ba8-19dd-4d4a-a0db-9879a85d124a';

-- Record: 96b30798-793a-4cf3-af52-6a65dde38bd4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '96b30798-793a-4cf3-af52-6a65dde38bd4';

-- Record: 7a187ed0-045b-4029-b3c1-595a2e6f4d79 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7a187ed0-045b-4029-b3c1-595a2e6f4d79';

-- Record: 36b84fd8-f519-45c5-a851-47cdb9ff008f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '36b84fd8-f519-45c5-a851-47cdb9ff008f';

-- Record: 4434148e-63f4-4d90-9ea0-13fbc1ad2823 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4434148e-63f4-4d90-9ea0-13fbc1ad2823';

-- Record: 6102d112-fe33-48bc-b9c3-ed4c1b8a809c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6102d112-fe33-48bc-b9c3-ed4c1b8a809c';

-- Record: 48cec7aa-fa2d-45e1-950e-df77c2faae4c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '48cec7aa-fa2d-45e1-950e-df77c2faae4c';

-- Record: e2553741-8953-4f18-8f1a-e14021715cc2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e2553741-8953-4f18-8f1a-e14021715cc2';

-- Record: 895d2909-ff4e-416e-8ad4-0cdedd2a5123 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '895d2909-ff4e-416e-8ad4-0cdedd2a5123';

-- Record: 8ec0bed3-19fd-431b-8f75-226b2c4f00b9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8ec0bed3-19fd-431b-8f75-226b2c4f00b9';

-- Record: ae470936-5bd0-4e27-b2c3-1e7e88eeab98 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ae470936-5bd0-4e27-b2c3-1e7e88eeab98';

-- Record: 141ad090-cb7c-4c4c-8443-9357eb70577d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '141ad090-cb7c-4c4c-8443-9357eb70577d';

-- Record: 6b183991-e462-4634-b320-a6ba1a9bb346 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6b183991-e462-4634-b320-a6ba1a9bb346';

-- Record: 249fb91e-6715-41be-9849-42b9e90f7019 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '249fb91e-6715-41be-9849-42b9e90f7019';

-- Record: f0df99fd-a0ed-4b41-8e88-03ca1874c22f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f0df99fd-a0ed-4b41-8e88-03ca1874c22f';

-- Record: 28db0d6e-d204-4ebd-af6c-11b070bf64a7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '28db0d6e-d204-4ebd-af6c-11b070bf64a7';

-- Record: ba1768f9-4806-4448-838b-feff261ccf4a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ba1768f9-4806-4448-838b-feff261ccf4a';

-- Record: daf5d1f2-b25e-4dec-89d8-8e441a5b0523 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'daf5d1f2-b25e-4dec-89d8-8e441a5b0523';

-- Record: 76c78e9e-82a3-4a91-b498-ec97bd629a44 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '76c78e9e-82a3-4a91-b498-ec97bd629a44';

-- Record: 508c9ce0-c650-4b8b-bfc2-b9464f867688 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '508c9ce0-c650-4b8b-bfc2-b9464f867688';

-- Record: 3f003787-006b-4e31-80b1-59cbe66f5c65 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3f003787-006b-4e31-80b1-59cbe66f5c65';

-- Record: c6a88f72-d3ea-42e8-9775-e31e31a7b18e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c6a88f72-d3ea-42e8-9775-e31e31a7b18e';

-- Record: b7de0d49-c98b-4975-873c-47e82d8cf6eb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b7de0d49-c98b-4975-873c-47e82d8cf6eb';

-- Record: 0207a722-7367-45dd-92c6-91fa3262e222 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0207a722-7367-45dd-92c6-91fa3262e222';

-- Record: 77b3e961-3544-4778-b818-7e1279f0623d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '77b3e961-3544-4778-b818-7e1279f0623d';

-- Record: f9122a0b-c616-4b8e-bcf7-1a9de3f53fe5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f9122a0b-c616-4b8e-bcf7-1a9de3f53fe5';

-- Record: 0d1a05fb-de5c-41ec-9330-efc22c02d2e9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0d1a05fb-de5c-41ec-9330-efc22c02d2e9';

-- Record: 3d19f9a5-4db6-42be-a52f-36a9adb27973 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3d19f9a5-4db6-42be-a52f-36a9adb27973';

-- Record: ff591cee-68f7-46dd-8e82-065d3fbc3c35 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ff591cee-68f7-46dd-8e82-065d3fbc3c35';

-- Record: d62229a1-c0b9-4360-ae61-b24baa4893b9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd62229a1-c0b9-4360-ae61-b24baa4893b9';

-- Record: ab97a8c4-4a67-4b50-bd56-a45e16918312 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ab97a8c4-4a67-4b50-bd56-a45e16918312';

-- Record: c59ce89b-e077-4134-a27d-362f98b8d3b8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c59ce89b-e077-4134-a27d-362f98b8d3b8';

-- Record: fd7b527f-5fda-46a6-b3ad-82f84d1e2bfb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fd7b527f-5fda-46a6-b3ad-82f84d1e2bfb';

-- Record: 3e14a080-fddd-41a2-860a-0849ae66b11d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3e14a080-fddd-41a2-860a-0849ae66b11d';

-- Record: 84240d07-bc6e-4dba-ba9d-05c4766f8b87 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '84240d07-bc6e-4dba-ba9d-05c4766f8b87';

-- Record: 49401209-8788-4e35-a58f-c34f606d4733 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '49401209-8788-4e35-a58f-c34f606d4733';

-- Record: 5a3719ad-9e89-414b-90cb-07d15bfb73b6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5a3719ad-9e89-414b-90cb-07d15bfb73b6';

-- Record: 80e435e5-3de8-4fe9-bea1-8edc9caf3e2a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '80e435e5-3de8-4fe9-bea1-8edc9caf3e2a';

-- Record: ac0a57ab-e641-4a22-94a9-4e8f5571634a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ac0a57ab-e641-4a22-94a9-4e8f5571634a';

-- Record: f4873a74-0280-4563-a4b7-c1c4991d0a65 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f4873a74-0280-4563-a4b7-c1c4991d0a65';

-- Record: 7c35671e-a2ba-4375-b485-7ed6586d7143 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7c35671e-a2ba-4375-b485-7ed6586d7143';

-- Record: be6b7f27-3fb9-49f6-933d-30134b06a9a3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'be6b7f27-3fb9-49f6-933d-30134b06a9a3';

-- Record: b2b56137-5d62-4c45-a12f-7aea6607cdc8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b2b56137-5d62-4c45-a12f-7aea6607cdc8';

-- Record: 1e3c58dd-f2d1-407c-abf2-2c866b16bb1e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1e3c58dd-f2d1-407c-abf2-2c866b16bb1e';

-- Record: 1a0cbeee-37e5-43eb-b41f-b007f45c5693 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1a0cbeee-37e5-43eb-b41f-b007f45c5693';

-- Record: caecbc8c-98b3-4de1-87ac-b69e613040ee (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'caecbc8c-98b3-4de1-87ac-b69e613040ee';

-- Record: dbb32556-2902-4707-975b-3385b5a5bd34 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'dbb32556-2902-4707-975b-3385b5a5bd34';

-- Record: ff0c350c-fa52-4697-a480-fd7586cac584 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ff0c350c-fa52-4697-a480-fd7586cac584';

-- Record: da248ddd-7224-464e-81bc-914b737872cb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'da248ddd-7224-464e-81bc-914b737872cb';

-- Record: f4746702-3ec0-496b-95fe-d62670fb98b8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f4746702-3ec0-496b-95fe-d62670fb98b8';

-- Record: 0befd11e-b89c-4192-af64-4c8c1a408636 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0befd11e-b89c-4192-af64-4c8c1a408636';

-- Record: 4fdb7731-e6ac-4d16-86b5-4114aa841690 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4fdb7731-e6ac-4d16-86b5-4114aa841690';

-- Record: d080c9b0-05ca-4fce-97f4-61a740bcde41 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd080c9b0-05ca-4fce-97f4-61a740bcde41';

-- Record: cad64bf7-bb5f-4c6d-a43c-cd7ed418fe9d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cad64bf7-bb5f-4c6d-a43c-cd7ed418fe9d';

-- Record: 001a3334-5f3d-4c61-a4c7-48380f9d1def (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '001a3334-5f3d-4c61-a4c7-48380f9d1def';

-- Record: 64748cd2-74d1-41a0-892b-f106df6bee94 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '64748cd2-74d1-41a0-892b-f106df6bee94';

-- Record: 28e47e6c-50ec-4b9f-b817-64f38f043b89 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '28e47e6c-50ec-4b9f-b817-64f38f043b89';

-- Record: e1a91121-05c9-4b98-9059-dca978146c4c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e1a91121-05c9-4b98-9059-dca978146c4c';

-- Record: bffd8e45-64f1-4e74-bc18-3a8850b3569f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bffd8e45-64f1-4e74-bc18-3a8850b3569f';

-- Record: 838f014f-3293-407b-9fde-1367058e7d6e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '838f014f-3293-407b-9fde-1367058e7d6e';

-- Record: 66dfe016-57a4-4b3d-be89-00a1944b3259 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '66dfe016-57a4-4b3d-be89-00a1944b3259';

-- Record: 25f7135c-3329-4c32-8813-95b8d312fb9f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '25f7135c-3329-4c32-8813-95b8d312fb9f';

-- Record: 36215ac2-df7a-4176-8114-36ec62d708c5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '36215ac2-df7a-4176-8114-36ec62d708c5';

-- Record: addb1230-2703-4f14-859e-6a3efb34d99f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'addb1230-2703-4f14-859e-6a3efb34d99f';

-- Record: e64cd9f0-58ce-49f7-a0dd-961cec1fef1f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e64cd9f0-58ce-49f7-a0dd-961cec1fef1f';

-- Record: f2529eb3-2b77-44b9-af28-8869aea8ce62 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f2529eb3-2b77-44b9-af28-8869aea8ce62';

-- Record: ff475068-84f3-4960-8a46-278395c3084a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ff475068-84f3-4960-8a46-278395c3084a';

-- Record: 54ca3373-bd5e-4092-8bee-5900ca213c55 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '54ca3373-bd5e-4092-8bee-5900ca213c55';

-- Record: 65a0c09e-a552-4aa1-aa2f-811a62045b0f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '65a0c09e-a552-4aa1-aa2f-811a62045b0f';

-- Record: 6509651e-7f1e-4da4-b5fc-c8fce03acef8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6509651e-7f1e-4da4-b5fc-c8fce03acef8';

-- Record: c52dbadd-0182-4812-bdf9-85eca6997224 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c52dbadd-0182-4812-bdf9-85eca6997224';

-- Record: 9fcf855e-44fd-49eb-8aff-a9237931f250 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9fcf855e-44fd-49eb-8aff-a9237931f250';

-- Record: 3425b30e-9f43-47bd-b1a5-340af8c8d558 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3425b30e-9f43-47bd-b1a5-340af8c8d558';

-- Record: 17fdb58b-d665-445b-bf69-65044ab310be (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '17fdb58b-d665-445b-bf69-65044ab310be';

-- Record: 53fbfe58-1d87-4021-a1da-4a4b8f5edad0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '53fbfe58-1d87-4021-a1da-4a4b8f5edad0';

-- Record: 9bbe35ab-df27-4dd1-bfd2-58fa6ec5e4eb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9bbe35ab-df27-4dd1-bfd2-58fa6ec5e4eb';

-- Record: b2a3e3ee-5585-4302-afff-4921940fa163 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b2a3e3ee-5585-4302-afff-4921940fa163';

-- Record: d5c5ec83-116b-41c1-9a81-4b7c0c531f3f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd5c5ec83-116b-41c1-9a81-4b7c0c531f3f';

-- Record: f130b9e8-866e-46b9-8cb6-408227b0fb78 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f130b9e8-866e-46b9-8cb6-408227b0fb78';

-- Record: 73a9a03f-9cb4-453b-840b-66cb0080f9d7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '73a9a03f-9cb4-453b-840b-66cb0080f9d7';

-- Record: 8050be4d-a87b-4241-82d4-95854ab6f567 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8050be4d-a87b-4241-82d4-95854ab6f567';

-- Record: 67b32f82-28fa-4bfb-b12e-a49ba961da31 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '67b32f82-28fa-4bfb-b12e-a49ba961da31';

-- Record: c56ea6d6-3c23-43d0-9a66-0d46c01ca707 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c56ea6d6-3c23-43d0-9a66-0d46c01ca707';

-- Record: 23b4e993-302f-4f24-8572-8e1ccdacb890 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '23b4e993-302f-4f24-8572-8e1ccdacb890';

-- Record: 9dad6506-2307-4539-8f57-0c2aca5b2a27 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9dad6506-2307-4539-8f57-0c2aca5b2a27';

-- Record: 4c042743-1e31-4c67-938b-eee04ac3863c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4c042743-1e31-4c67-938b-eee04ac3863c';

-- Record: b360282a-7811-4a29-9741-0ceaf141061a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b360282a-7811-4a29-9741-0ceaf141061a';

-- Record: 21ca9bc0-8dad-4f18-82c2-95747090b66e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '21ca9bc0-8dad-4f18-82c2-95747090b66e';

-- Record: d8ff4ee4-3072-4843-ba15-2cf5e5f4e0a8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd8ff4ee4-3072-4843-ba15-2cf5e5f4e0a8';

-- Record: 40144bf0-fb46-40d1-8392-6bfd6781823f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '40144bf0-fb46-40d1-8392-6bfd6781823f';

-- Record: 57489edf-2415-4d28-b297-ee353267762c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '57489edf-2415-4d28-b297-ee353267762c';

-- Record: 396be1dd-ed7a-4455-a275-2d0b7997acf1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '396be1dd-ed7a-4455-a275-2d0b7997acf1';

-- Record: bc22a104-968f-4f23-b9d7-f7649e2a6edd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bc22a104-968f-4f23-b9d7-f7649e2a6edd';

-- Record: 67e56331-194a-4ec5-9d58-fc64075bfe2d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '67e56331-194a-4ec5-9d58-fc64075bfe2d';

-- Record: 4a025636-4708-4297-8b20-494e5d5f2a5b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4a025636-4708-4297-8b20-494e5d5f2a5b';

-- Record: f6e95f2a-2f17-4b78-a212-71f8a14e0787 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f6e95f2a-2f17-4b78-a212-71f8a14e0787';

-- Record: 96cb7437-2107-41df-8687-a2a863f7c52e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '96cb7437-2107-41df-8687-a2a863f7c52e';

-- Record: f5399583-2a45-4801-aa7e-2d31a5f059ee (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f5399583-2a45-4801-aa7e-2d31a5f059ee';

-- Record: ffb42f7f-8583-4226-8bb9-82d048472d43 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ffb42f7f-8583-4226-8bb9-82d048472d43';

-- Record: e9fc2aaa-3dd9-4fae-b0f2-a18fdff0404f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e9fc2aaa-3dd9-4fae-b0f2-a18fdff0404f';

-- Record: 29e17355-64d5-45b4-b32c-1434bb11687b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '29e17355-64d5-45b4-b32c-1434bb11687b';

-- Record: 0063956f-2964-4a32-b466-e379dcefca80 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0063956f-2964-4a32-b466-e379dcefca80';

-- Record: 1076fe9d-5812-4075-b06d-2dd6f53d0092 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1076fe9d-5812-4075-b06d-2dd6f53d0092';

-- Record: 652d81ba-0605-4f50-83b4-26a8fbf6edc9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '652d81ba-0605-4f50-83b4-26a8fbf6edc9';

-- Record: 93116b23-ed25-4c1b-bcf8-394c64b048a7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '93116b23-ed25-4c1b-bcf8-394c64b048a7';

-- Record: cba5c475-ca35-472c-a3a4-dc31b417bc08 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cba5c475-ca35-472c-a3a4-dc31b417bc08';

-- Record: 3eec12d5-e246-4281-8b73-9b2300c54dee (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3eec12d5-e246-4281-8b73-9b2300c54dee';

-- Record: 222ba80c-3a2a-4422-b4c1-da1baab7b35e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '222ba80c-3a2a-4422-b4c1-da1baab7b35e';

-- Record: 90574878-6a13-4da5-aa43-cc51298d39c6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '90574878-6a13-4da5-aa43-cc51298d39c6';

-- Record: 268dee06-b044-4814-866c-3651a1289ad0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '268dee06-b044-4814-866c-3651a1289ad0';

-- Record: 814c2209-fe69-44ca-b156-e1ef6e46bde5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '814c2209-fe69-44ca-b156-e1ef6e46bde5';

-- Record: 368a069c-05f4-40dc-9149-4cbfe40eae40 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '368a069c-05f4-40dc-9149-4cbfe40eae40';

-- Record: c03c9831-44f3-4706-ab6f-182ad71e8ce3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c03c9831-44f3-4706-ab6f-182ad71e8ce3';

-- Record: d7b8b753-a841-4444-b653-38d52642091b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd7b8b753-a841-4444-b653-38d52642091b';

-- Record: 3f41b621-5581-4ce3-a88c-8299aa450d1e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3f41b621-5581-4ce3-a88c-8299aa450d1e';

-- Record: 434b83fb-e88c-4154-8f4b-a7aed30ba916 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '434b83fb-e88c-4154-8f4b-a7aed30ba916';

-- Record: fe77a979-836d-48f5-abab-c5bcafe92425 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fe77a979-836d-48f5-abab-c5bcafe92425';

-- Record: fe58ddbb-4975-4d19-8b37-d0819425fe68 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fe58ddbb-4975-4d19-8b37-d0819425fe68';

-- Record: 065888ff-b46c-45cf-9a4e-2dcb64258d03 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '065888ff-b46c-45cf-9a4e-2dcb64258d03';

-- Record: e4c543fc-df8f-41d7-bd25-0d8f583c038e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e4c543fc-df8f-41d7-bd25-0d8f583c038e';

-- Record: 262f8e2f-aca0-49de-84a3-35b5d1018688 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '262f8e2f-aca0-49de-84a3-35b5d1018688';

-- Record: b4254d77-1f29-448a-bb37-4f579c6dec14 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b4254d77-1f29-448a-bb37-4f579c6dec14';

-- Record: c9b0e818-07d4-4ba7-a043-886c874de66b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c9b0e818-07d4-4ba7-a043-886c874de66b';

-- Record: c9b7a80a-e47d-48ac-bb90-34d87adce9c2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c9b7a80a-e47d-48ac-bb90-34d87adce9c2';

-- Record: bf9876f2-eb7b-4fd6-a25e-bcab917f1857 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bf9876f2-eb7b-4fd6-a25e-bcab917f1857';

-- Record: 0d24f3ef-9709-4abc-9a30-f1f6376586d5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0d24f3ef-9709-4abc-9a30-f1f6376586d5';

-- Record: 7d764f42-7736-40b7-a53c-081205cca64e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7d764f42-7736-40b7-a53c-081205cca64e';

-- Record: 9f45c139-0870-4a91-8057-7f2fef8007f3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9f45c139-0870-4a91-8057-7f2fef8007f3';

-- Record: 624c05c9-1311-4691-8d33-5c9cf8591a55 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '624c05c9-1311-4691-8d33-5c9cf8591a55';

-- Record: 2fb495be-31ce-46e3-b309-b73c3d24260e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2fb495be-31ce-46e3-b309-b73c3d24260e';

-- Record: a9dc24f3-4861-462b-b584-1628ec0f9ad7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a9dc24f3-4861-462b-b584-1628ec0f9ad7';

-- Record: bb51d8d8-a05f-4877-8b55-6d5d64ebb15b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bb51d8d8-a05f-4877-8b55-6d5d64ebb15b';

-- Record: f14664a4-e724-4c48-8f15-9ce0588813c4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f14664a4-e724-4c48-8f15-9ce0588813c4';

-- Record: 7f56635d-25c8-4695-b424-c1270dd11ffd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7f56635d-25c8-4695-b424-c1270dd11ffd';

-- Record: 1a920562-d88b-4fb4-b720-69cdb21dc66d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1a920562-d88b-4fb4-b720-69cdb21dc66d';

-- Record: c3498f0a-3929-4af1-967f-dd97561fe862 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c3498f0a-3929-4af1-967f-dd97561fe862';

-- Record: b07c9c99-fd42-4bc4-a35f-e341be30ab16 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b07c9c99-fd42-4bc4-a35f-e341be30ab16';

-- Record: 75e5973b-245a-4fc0-9bd0-81eeec8e5ab6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '75e5973b-245a-4fc0-9bd0-81eeec8e5ab6';

-- Record: b33d0b01-0c96-4edd-8608-29d7d0c337db (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b33d0b01-0c96-4edd-8608-29d7d0c337db';

-- Record: 4bc1d89c-cd39-4336-9eee-c4cfda14c520 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4bc1d89c-cd39-4336-9eee-c4cfda14c520';

-- Record: ae0783a2-0749-4c84-8f3c-e2f9ef063aea (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ae0783a2-0749-4c84-8f3c-e2f9ef063aea';

-- Record: ad92fc51-afda-46eb-aa56-6342d6987d16 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ad92fc51-afda-46eb-aa56-6342d6987d16';

-- Record: 2ed00cac-926b-47ac-aaac-6cdd9d251eab (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2ed00cac-926b-47ac-aaac-6cdd9d251eab';

-- Record: 1e0d60f1-6f72-402c-bcc0-9d7525cddbe7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1e0d60f1-6f72-402c-bcc0-9d7525cddbe7';

-- Record: b8784b0d-895e-42f5-9377-e967f58273cf (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b8784b0d-895e-42f5-9377-e967f58273cf';

-- Record: 005d0de5-ad03-4b89-a653-233f5cd47fcb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '005d0de5-ad03-4b89-a653-233f5cd47fcb';

-- Record: 55552055-6168-462f-9139-973ade04ba93 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '55552055-6168-462f-9139-973ade04ba93';

-- Record: 043c3268-bd1a-4c2c-b19d-99c9678ef2e7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '043c3268-bd1a-4c2c-b19d-99c9678ef2e7';

-- Record: 845f13e5-d703-4811-a8b0-535cb2b44a59 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '845f13e5-d703-4811-a8b0-535cb2b44a59';

-- Record: 16734320-9602-49ce-bc06-5b20d22c0202 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '16734320-9602-49ce-bc06-5b20d22c0202';

-- Record: 8ffde2a6-ceb1-4873-afcc-4ea0675bf46a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8ffde2a6-ceb1-4873-afcc-4ea0675bf46a';

-- Record: 7add9df6-792a-4cf8-a14d-36f1dda965b3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7add9df6-792a-4cf8-a14d-36f1dda965b3';

-- Record: 7d4d1e4c-12f5-410d-b392-aec32330f526 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7d4d1e4c-12f5-410d-b392-aec32330f526';

-- Record: b495a0a9-949d-4708-8118-f9e56547804e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b495a0a9-949d-4708-8118-f9e56547804e';

-- Record: 8db1558a-8524-4314-a1db-b6060f9a0717 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8db1558a-8524-4314-a1db-b6060f9a0717';

-- Record: 36059afb-24f7-4123-932d-183d88bf104d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '36059afb-24f7-4123-932d-183d88bf104d';

-- Record: 599c4ca1-de2e-40de-9c56-f2139e4a2e94 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '599c4ca1-de2e-40de-9c56-f2139e4a2e94';

-- Record: 14465382-4c68-4be2-9c2e-9691fca8ed72 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '14465382-4c68-4be2-9c2e-9691fca8ed72';

-- Record: f4005a2c-8709-47a6-8e5e-369e507cdffb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f4005a2c-8709-47a6-8e5e-369e507cdffb';

-- Record: feadf5f9-d91a-4dca-b0de-4af9fc179137 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'feadf5f9-d91a-4dca-b0de-4af9fc179137';

-- Record: 8841bdb3-0066-48b5-8d34-2ed0820ba1f3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8841bdb3-0066-48b5-8d34-2ed0820ba1f3';

-- Record: 3b9e19aa-c0f9-4eb2-bfbb-c1fee1254553 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3b9e19aa-c0f9-4eb2-bfbb-c1fee1254553';

-- Record: 2c14434d-a4ae-44fa-8656-459017c4f2b0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2c14434d-a4ae-44fa-8656-459017c4f2b0';

-- Record: 137cf38c-596c-43f4-aa4d-d6125e10330e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '137cf38c-596c-43f4-aa4d-d6125e10330e';

-- Record: 102e3c4e-3f30-42e9-a513-fe6b0c2c7ca7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '102e3c4e-3f30-42e9-a513-fe6b0c2c7ca7';

-- Record: 2361d1fc-5b8a-4486-b56e-e43cc801aba8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2361d1fc-5b8a-4486-b56e-e43cc801aba8';

-- Record: 78a615b4-8e2c-4627-8123-1146f1fd86a1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '78a615b4-8e2c-4627-8123-1146f1fd86a1';

-- Record: dfbb43d2-88dc-4c7d-ab99-a1b77a33e19f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'dfbb43d2-88dc-4c7d-ab99-a1b77a33e19f';

-- Record: 581e6821-9213-41b5-9ee3-939648e2c4b0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '581e6821-9213-41b5-9ee3-939648e2c4b0';

-- Record: a9cdc4c7-7146-4efe-8ab9-4f856a744973 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a9cdc4c7-7146-4efe-8ab9-4f856a744973';

-- Record: aa2b67d4-0e98-4f8b-9f9d-f1c83a1463e0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'aa2b67d4-0e98-4f8b-9f9d-f1c83a1463e0';

-- Record: 880d5060-3a37-47fd-b638-1347430d35b0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '880d5060-3a37-47fd-b638-1347430d35b0';

-- Record: 129623ef-976a-4dff-95ba-e4544add64b7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '129623ef-976a-4dff-95ba-e4544add64b7';

-- Record: f603221c-d981-4187-981e-c362db0684bd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f603221c-d981-4187-981e-c362db0684bd';

-- Record: 1ab0b1e0-d18b-4cf2-8cf9-16d82e724d4b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1ab0b1e0-d18b-4cf2-8cf9-16d82e724d4b';

-- Record: b67d4def-4bf9-43d8-8aef-8ffebe7ab432 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b67d4def-4bf9-43d8-8aef-8ffebe7ab432';

-- Record: 5c1742be-9b71-4803-af6c-86ffe97e2bf5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5c1742be-9b71-4803-af6c-86ffe97e2bf5';

-- Record: d863637d-5b8e-413c-aecb-bd747f93a42c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd863637d-5b8e-413c-aecb-bd747f93a42c';

-- Record: cfe06935-8917-44fe-9069-41f5970c984f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cfe06935-8917-44fe-9069-41f5970c984f';

-- Record: 149370e6-9e59-43d4-b63b-e65a56bdaa94 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '149370e6-9e59-43d4-b63b-e65a56bdaa94';

-- Record: 43a4cb1e-a2e0-4562-8bd3-68acc3b2b1e8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '43a4cb1e-a2e0-4562-8bd3-68acc3b2b1e8';

-- Record: 334c5524-3a0a-4f33-9186-d9d805172ea3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '334c5524-3a0a-4f33-9186-d9d805172ea3';

-- Record: 51adbc35-aec0-44dd-8c22-dfef7e9c9f9e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '51adbc35-aec0-44dd-8c22-dfef7e9c9f9e';

-- Record: c2de1de1-3c55-4b3e-b52d-5c554164fe31 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c2de1de1-3c55-4b3e-b52d-5c554164fe31';

-- Record: 69240bee-6207-4bac-864c-2bf63b64955b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '69240bee-6207-4bac-864c-2bf63b64955b';

-- Record: 02e7ded8-fe57-4af0-ba92-1edb2b98255a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '02e7ded8-fe57-4af0-ba92-1edb2b98255a';

-- Record: 73b9d50d-a232-4b3b-8d2d-5a7771529446 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '73b9d50d-a232-4b3b-8d2d-5a7771529446';

-- Record: fb1023cc-3d4b-4807-abe5-1f070bd99c14 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fb1023cc-3d4b-4807-abe5-1f070bd99c14';

-- Record: 9bfc0a5c-68c7-428a-a31a-e5b6acd1baa3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9bfc0a5c-68c7-428a-a31a-e5b6acd1baa3';

-- Record: e1bff8d2-ec3b-41d2-9981-8650e38ee951 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e1bff8d2-ec3b-41d2-9981-8650e38ee951';

-- Record: 97135d0e-89c3-4774-aca3-cf23142ad424 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '97135d0e-89c3-4774-aca3-cf23142ad424';

-- Record: bf190f36-10f8-49aa-8e80-8c84d4eb9ed4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bf190f36-10f8-49aa-8e80-8c84d4eb9ed4';

-- Record: b02dd8f3-1724-420c-a10a-973dfe6cfa24 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b02dd8f3-1724-420c-a10a-973dfe6cfa24';

-- Record: b86e4d1c-486f-4d82-a432-73f8ab717b1d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b86e4d1c-486f-4d82-a432-73f8ab717b1d';

-- Record: 410a0047-0596-4a1b-abd6-26e40000ee36 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '410a0047-0596-4a1b-abd6-26e40000ee36';

-- Record: 5092f513-be1c-4749-a3fa-95f162839d95 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5092f513-be1c-4749-a3fa-95f162839d95';

-- Record: f4f9a138-8958-4132-9bb3-b4d203056111 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f4f9a138-8958-4132-9bb3-b4d203056111';

-- Record: 538337f1-9db7-4062-83ba-6cd37f91bc81 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '538337f1-9db7-4062-83ba-6cd37f91bc81';

-- Record: 2d48c4c2-c4c3-4076-a3f3-b44f9a876481 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2d48c4c2-c4c3-4076-a3f3-b44f9a876481';

-- Record: 34823480-0da1-4c96-9f24-d013a684dcc8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '34823480-0da1-4c96-9f24-d013a684dcc8';

-- Record: debabf6e-d820-4b9d-8a97-a4758318a946 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'debabf6e-d820-4b9d-8a97-a4758318a946';

-- Record: f4be17e4-94bf-4724-86fa-a161be32a8b2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f4be17e4-94bf-4724-86fa-a161be32a8b2';

-- Record: 38bc9c8e-ad40-4beb-81db-46f1f79b267a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '38bc9c8e-ad40-4beb-81db-46f1f79b267a';

-- Record: 9d0d9389-19ec-4773-91bd-8e4474501300 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9d0d9389-19ec-4773-91bd-8e4474501300';

-- Record: c97024ca-e784-4a2c-b481-1d3c37a55dfc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c97024ca-e784-4a2c-b481-1d3c37a55dfc';

-- Record: 7b58e35d-77ab-414b-bc4b-ad734a6a5790 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7b58e35d-77ab-414b-bc4b-ad734a6a5790';

-- Record: d16212d3-6fc0-48c6-a690-da8a64aea0d3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd16212d3-6fc0-48c6-a690-da8a64aea0d3';

-- Record: 7918b0f1-514b-43ca-bca7-dcc2192db1c3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7918b0f1-514b-43ca-bca7-dcc2192db1c3';

-- Record: dcc7c9f2-e82f-47d4-908b-df5f8c291730 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'dcc7c9f2-e82f-47d4-908b-df5f8c291730';

-- Record: bfa81800-9f46-4cef-86d6-0aff2afe4b1a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bfa81800-9f46-4cef-86d6-0aff2afe4b1a';

-- Record: 01ae18e1-1a1b-4802-a569-fc43d5fe90dd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '01ae18e1-1a1b-4802-a569-fc43d5fe90dd';

-- Record: b00f1c4d-f744-4f81-9c55-2a6056c47c07 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b00f1c4d-f744-4f81-9c55-2a6056c47c07';

-- Record: bcc6b7ad-4bb6-440c-a56f-c217eeb9d22e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bcc6b7ad-4bb6-440c-a56f-c217eeb9d22e';

-- Record: 746fe3be-249f-4fb8-a7f3-310fef62d4c8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '746fe3be-249f-4fb8-a7f3-310fef62d4c8';

-- Record: 334b0ced-6ced-48e0-a1ed-c24ba1c2cd43 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '334b0ced-6ced-48e0-a1ed-c24ba1c2cd43';

-- Record: 95163cc8-ebd7-42c5-9d18-38651cdda182 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '95163cc8-ebd7-42c5-9d18-38651cdda182';

-- Record: b7f9fd79-907e-4fe4-8f13-171efc9f6c8a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b7f9fd79-907e-4fe4-8f13-171efc9f6c8a';

-- Record: a4982382-697a-460e-882f-740843e69ab5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a4982382-697a-460e-882f-740843e69ab5';

-- Record: 6edc769f-a022-43ad-8987-5b407a9bb98c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6edc769f-a022-43ad-8987-5b407a9bb98c';

-- Record: 5754f2c1-24ff-4120-b3d5-c7c421ed81d6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5754f2c1-24ff-4120-b3d5-c7c421ed81d6';

-- Record: a103abda-164a-4d8f-b4dc-c68503cc3834 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a103abda-164a-4d8f-b4dc-c68503cc3834';

-- Record: a65c5c34-3b81-4a90-9591-57cabc258c6f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a65c5c34-3b81-4a90-9591-57cabc258c6f';

-- Record: 5380ade1-1737-4aaa-a6c6-e96f1d8af84d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5380ade1-1737-4aaa-a6c6-e96f1d8af84d';

-- Record: 1583de7d-2a19-46a7-b011-7a1877024cd9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1583de7d-2a19-46a7-b011-7a1877024cd9';

-- Record: 942f1930-96a5-4290-959e-e4992d421d41 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '942f1930-96a5-4290-959e-e4992d421d41';

-- Record: e81cff9a-3da1-4066-bd42-52c7a55a60b3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e81cff9a-3da1-4066-bd42-52c7a55a60b3';

-- Record: 20a7dfda-f47d-4427-bb48-e84d8d5c487f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '20a7dfda-f47d-4427-bb48-e84d8d5c487f';

-- Record: 8e1a5adc-3ecd-4165-8d42-381398195c63 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8e1a5adc-3ecd-4165-8d42-381398195c63';

-- Record: ae76ed2a-a633-4df4-a4e9-190ee0febf5d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ae76ed2a-a633-4df4-a4e9-190ee0febf5d';

-- Record: 419d5a99-899c-4b5a-9df3-860788eea385 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '419d5a99-899c-4b5a-9df3-860788eea385';

-- Record: 5b3e41b7-cd7b-48f5-bc94-a4e324a1809e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5b3e41b7-cd7b-48f5-bc94-a4e324a1809e';

-- Record: 0deb0a3a-cbba-4e32-a7c3-9c3e53c882e5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0deb0a3a-cbba-4e32-a7c3-9c3e53c882e5';

-- Record: 3833d104-8a1e-4c8e-add0-3c0e6c9cbdeb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3833d104-8a1e-4c8e-add0-3c0e6c9cbdeb';

-- Record: d381a6cf-0194-45ec-83f6-ae19245e9a5e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd381a6cf-0194-45ec-83f6-ae19245e9a5e';

-- Record: 45e2c9fd-8fea-4b7e-985c-b4394ebd545f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '45e2c9fd-8fea-4b7e-985c-b4394ebd545f';

-- Record: 84e4c1cc-f273-433a-b566-182f3f700dcb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '84e4c1cc-f273-433a-b566-182f3f700dcb';

-- Record: c842cbe5-908d-47c6-a651-61fa041d873b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c842cbe5-908d-47c6-a651-61fa041d873b';

-- Record: de52b76e-5728-4a76-8566-6c2ba41869ed (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'de52b76e-5728-4a76-8566-6c2ba41869ed';

-- Record: 5979e873-f969-4189-b1a8-4f81ff4f20c1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5979e873-f969-4189-b1a8-4f81ff4f20c1';

-- Record: 378835b0-5127-4e41-ab5c-27c19c75f982 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '378835b0-5127-4e41-ab5c-27c19c75f982';

-- Record: 39c54ded-26f2-402a-b27a-2327066de093 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '39c54ded-26f2-402a-b27a-2327066de093';

-- Record: 6ff2ee39-e5b1-40e5-a1d5-5c5721ef18ff (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6ff2ee39-e5b1-40e5-a1d5-5c5721ef18ff';

-- Record: 9b4adaf2-e91b-440d-8c16-544081d4af78 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9b4adaf2-e91b-440d-8c16-544081d4af78';

-- Record: 2c737d15-5965-44af-801c-78af17fb7b11 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2c737d15-5965-44af-801c-78af17fb7b11';

-- Record: d9f47862-f1f7-45de-9489-f3f217eb441e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd9f47862-f1f7-45de-9489-f3f217eb441e';

-- Record: 3485c1ff-a987-45f5-bfc2-ea19dfdea2f9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3485c1ff-a987-45f5-bfc2-ea19dfdea2f9';

-- Record: d0a4d40e-5b2f-4726-a781-e979ed51f50d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd0a4d40e-5b2f-4726-a781-e979ed51f50d';

-- Record: f915bde1-bf9c-4f33-88a6-3249a011e07c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f915bde1-bf9c-4f33-88a6-3249a011e07c';

-- Record: 177b42f7-6e25-4509-b6b9-7feaced05b4b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '177b42f7-6e25-4509-b6b9-7feaced05b4b';

-- Record: fd8a35a9-b3a6-4a66-96f4-f5151d7df0f2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fd8a35a9-b3a6-4a66-96f4-f5151d7df0f2';

-- Record: 42422815-1424-4969-9be7-d8482b2f9e46 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '42422815-1424-4969-9be7-d8482b2f9e46';

-- Record: 00f31af2-f027-40c3-b6c1-4bac67b9b546 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '00f31af2-f027-40c3-b6c1-4bac67b9b546';

-- Record: d3137473-0478-49d9-836c-13ddefdc94e7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd3137473-0478-49d9-836c-13ddefdc94e7';

-- Record: f2994909-f1f8-4a0a-8da0-5a0af4413747 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f2994909-f1f8-4a0a-8da0-5a0af4413747';

-- Record: 50c8e492-93ad-4d2d-a45c-94eb94674303 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '50c8e492-93ad-4d2d-a45c-94eb94674303';

-- Record: 646ffbfb-ef5a-493f-8d86-0eadbd3a8e4d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '646ffbfb-ef5a-493f-8d86-0eadbd3a8e4d';

-- Record: 129bb96a-1be3-4f75-a96b-6302cb100729 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '129bb96a-1be3-4f75-a96b-6302cb100729';

-- Record: 2759bcf3-3430-4c59-9301-b3c237b18d95 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2759bcf3-3430-4c59-9301-b3c237b18d95';

-- Record: c57914d1-bbdc-42f9-bbb5-aa825e48c8d5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c57914d1-bbdc-42f9-bbb5-aa825e48c8d5';

-- Record: fc869eb6-19a3-40b6-be02-3f03afb3d2d5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fc869eb6-19a3-40b6-be02-3f03afb3d2d5';

-- Record: 74edc268-623f-447b-8e56-2dd322ce770d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '74edc268-623f-447b-8e56-2dd322ce770d';

-- Record: 500808e9-ca6c-44a0-a9c8-67938068e943 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '500808e9-ca6c-44a0-a9c8-67938068e943';

-- Record: ea27c8b8-33ca-4c58-a1d4-1b567cedd6a1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ea27c8b8-33ca-4c58-a1d4-1b567cedd6a1';

-- Record: 60a6bce7-deea-411d-b5d7-a6b1913d68bd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '60a6bce7-deea-411d-b5d7-a6b1913d68bd';

-- Record: 850deaac-af76-41bc-9bd8-2b1d79e0058b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '850deaac-af76-41bc-9bd8-2b1d79e0058b';

-- Record: 18ae5ac2-3fa3-4472-8053-e45c5e9de385 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '18ae5ac2-3fa3-4472-8053-e45c5e9de385';

-- Record: 5549c918-4f1a-4f3a-921c-086ad8d8a4d9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5549c918-4f1a-4f3a-921c-086ad8d8a4d9';

-- Record: 499d6049-ab0e-4f64-aba9-44894b03794b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '499d6049-ab0e-4f64-aba9-44894b03794b';

-- Record: 0b9cfec5-498b-40bc-b843-ab99b18b3f3d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0b9cfec5-498b-40bc-b843-ab99b18b3f3d';

-- Record: 2b23638e-3823-4b60-849d-5e13010d9232 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2b23638e-3823-4b60-849d-5e13010d9232';

-- Record: dbc28e75-c508-4278-8bd3-a94627dd0f59 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'dbc28e75-c508-4278-8bd3-a94627dd0f59';

-- Record: 7360dc00-b140-46a2-adb0-405b9206caae (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7360dc00-b140-46a2-adb0-405b9206caae';

-- Record: 1699e9db-8ea0-4728-868a-a5fca5673f63 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1699e9db-8ea0-4728-868a-a5fca5673f63';

-- Record: 75bdf8b2-f4bf-42eb-9b82-b3cab56ed451 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '75bdf8b2-f4bf-42eb-9b82-b3cab56ed451';

-- Record: b4b15075-7c67-4899-9ea7-2dc791af4708 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b4b15075-7c67-4899-9ea7-2dc791af4708';

-- Record: e1282353-0436-423d-ac65-6e252fcaf2a9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e1282353-0436-423d-ac65-6e252fcaf2a9';

-- Record: 445a85d5-cd69-4c7f-81af-8bf395ab16c7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '445a85d5-cd69-4c7f-81af-8bf395ab16c7';

-- Record: d268cb99-9485-4ce8-9db7-ec0396ea11e7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd268cb99-9485-4ce8-9db7-ec0396ea11e7';

-- Record: 070b2a2a-1dd6-4688-ad5b-48a19fb41e3a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '070b2a2a-1dd6-4688-ad5b-48a19fb41e3a';

-- Record: da2f1207-3777-4805-be64-f445afc6f901 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'da2f1207-3777-4805-be64-f445afc6f901';

-- Record: 04df912e-d26c-4e99-9728-56f3fb60e40c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '04df912e-d26c-4e99-9728-56f3fb60e40c';

-- Record: acdd9da8-c46a-42e9-aa99-1de4ea9ce2ec (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'acdd9da8-c46a-42e9-aa99-1de4ea9ce2ec';

-- Record: a46dcf90-728d-42df-b268-b3ab2769bdea (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a46dcf90-728d-42df-b268-b3ab2769bdea';

-- Record: 9816a37c-e7fd-47ae-8661-30a1a8929371 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9816a37c-e7fd-47ae-8661-30a1a8929371';

-- Record: fb4e7871-b435-4bac-abe8-0857f2babf98 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fb4e7871-b435-4bac-abe8-0857f2babf98';

-- Record: d3c0af8d-8dbe-4f63-beb6-118368bfcfaa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd3c0af8d-8dbe-4f63-beb6-118368bfcfaa';

-- Record: 984736c4-1b93-415c-8917-ac4764b6f17f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '984736c4-1b93-415c-8917-ac4764b6f17f';

-- Record: fef35590-65fd-45bd-923a-94cbe3069358 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fef35590-65fd-45bd-923a-94cbe3069358';

-- Record: 511f7de9-0114-4680-bbf1-3eeb138bec3c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '511f7de9-0114-4680-bbf1-3eeb138bec3c';

-- Record: 1268d51c-91de-423e-b3dc-d17cb7d00e1c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1268d51c-91de-423e-b3dc-d17cb7d00e1c';

-- Record: 6923344f-754c-4b13-8b2a-fcb63bf996a9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6923344f-754c-4b13-8b2a-fcb63bf996a9';

-- Record: fd42c6e6-b775-498e-ab2a-98be1c33c542 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fd42c6e6-b775-498e-ab2a-98be1c33c542';

-- Record: 481b5407-6a35-4165-a7f1-78ede2bac8eb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '481b5407-6a35-4165-a7f1-78ede2bac8eb';

-- Record: 1957e186-9acf-4201-88f7-7c254da1fb64 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1957e186-9acf-4201-88f7-7c254da1fb64';

-- Record: 1996dc4e-9d7e-4ae9-b2d5-43984cfaa719 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1996dc4e-9d7e-4ae9-b2d5-43984cfaa719';

-- Record: 2557684c-d7cd-45da-80d1-f00818adf7cc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2557684c-d7cd-45da-80d1-f00818adf7cc';

-- Record: 9c323a74-6a05-4e34-a24e-6f34bdb33da3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9c323a74-6a05-4e34-a24e-6f34bdb33da3';

-- Record: 18ee8c1e-c007-494b-93ce-b84c0b015d13 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '18ee8c1e-c007-494b-93ce-b84c0b015d13';

-- Record: 86949fb3-8732-4604-8930-71218c5cd5f9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '86949fb3-8732-4604-8930-71218c5cd5f9';

-- Record: ef33263b-d983-4ebc-bb6e-1133b9176a39 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ef33263b-d983-4ebc-bb6e-1133b9176a39';

-- Record: 84972f6e-82c9-40d4-bb84-5183cecf0d8c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '84972f6e-82c9-40d4-bb84-5183cecf0d8c';

-- Record: 83fec91b-7e4a-40c8-a48a-be7d9b34276b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '83fec91b-7e4a-40c8-a48a-be7d9b34276b';

-- Record: 027493cb-1df6-4d26-bf12-e267512a6c28 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '027493cb-1df6-4d26-bf12-e267512a6c28';

-- Record: c35b3bb3-67e5-4cd9-99ab-e98b52e8ef69 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c35b3bb3-67e5-4cd9-99ab-e98b52e8ef69';

-- Record: c9eb940c-ed38-4e2b-817e-daa7e2b1cd6a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c9eb940c-ed38-4e2b-817e-daa7e2b1cd6a';

-- Record: 6685d5be-136a-4c4b-ac56-ae3e6aad6cf2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6685d5be-136a-4c4b-ac56-ae3e6aad6cf2';

-- Record: 41b4be18-de98-494c-a498-89c572a64f6e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '41b4be18-de98-494c-a498-89c572a64f6e';

-- Record: ff328153-1f57-47dd-8259-7846fc233eb3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ff328153-1f57-47dd-8259-7846fc233eb3';

-- Record: b7f5f186-1b25-4f07-a921-f5144b07c027 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b7f5f186-1b25-4f07-a921-f5144b07c027';

-- Record: e78e810b-c173-4764-957b-e8be65ff913f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e78e810b-c173-4764-957b-e8be65ff913f';

-- Record: 43e91775-24bb-4c2e-8c98-0631c9e9af1a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '43e91775-24bb-4c2e-8c98-0631c9e9af1a';

-- Record: 2a672e74-3196-4846-ad26-f7754cb36430 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2a672e74-3196-4846-ad26-f7754cb36430';

-- Record: 615704c2-755e-4931-a515-3d24bf581f3d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '615704c2-755e-4931-a515-3d24bf581f3d';

-- Record: 9cb0b881-b140-40fd-a78f-260e15310684 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9cb0b881-b140-40fd-a78f-260e15310684';

-- Record: 2629ee00-20be-4da1-940e-1304b62fcbe0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2629ee00-20be-4da1-940e-1304b62fcbe0';

-- Record: 1ad01e5f-59d8-4f97-bccd-bb8219c21022 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1ad01e5f-59d8-4f97-bccd-bb8219c21022';

-- Record: 28b494fd-170a-4f7e-9950-d56158f45498 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '28b494fd-170a-4f7e-9950-d56158f45498';

-- Record: 0453504f-0d25-4bda-81b5-523454b93913 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0453504f-0d25-4bda-81b5-523454b93913';

-- Record: 1588ad31-2c83-403e-8a3f-4da2c62b9765 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1588ad31-2c83-403e-8a3f-4da2c62b9765';

-- Record: ac1a7061-3c3a-4cec-9a19-36f364fddfc0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ac1a7061-3c3a-4cec-9a19-36f364fddfc0';

-- Record: 2c3439a7-ff8e-4175-b322-83ca46fa8181 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2c3439a7-ff8e-4175-b322-83ca46fa8181';

-- Record: 37ac960b-927f-402d-be35-a7657dd8bbb8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '37ac960b-927f-402d-be35-a7657dd8bbb8';

-- Record: 024877c7-516d-4849-8313-29577a370dc0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '024877c7-516d-4849-8313-29577a370dc0';

-- Record: 2e4ecb52-2e3e-48cc-b5af-c467da4514f4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2e4ecb52-2e3e-48cc-b5af-c467da4514f4';

-- Record: 5fb9db64-74ff-427d-83da-d135a5ce663c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5fb9db64-74ff-427d-83da-d135a5ce663c';

-- Record: eb59cb1c-eb24-43ec-87b2-939bef09059e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'eb59cb1c-eb24-43ec-87b2-939bef09059e';

-- Record: 0e421f1a-b2df-4b92-baec-cdb6e33d987e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0e421f1a-b2df-4b92-baec-cdb6e33d987e';

-- Record: faea6a3e-24da-480e-b6a2-4b203f2f73a8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'faea6a3e-24da-480e-b6a2-4b203f2f73a8';

-- Record: 7bfb2d00-60e2-4e4d-858f-9334b1dbe5d3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7bfb2d00-60e2-4e4d-858f-9334b1dbe5d3';

-- Record: 3a72c708-c726-4c4e-a8e1-039d8913954b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3a72c708-c726-4c4e-a8e1-039d8913954b';

-- Record: 493e18eb-d46c-43bc-be9d-172b882711b7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '493e18eb-d46c-43bc-be9d-172b882711b7';

-- Record: c7cfa288-9925-4bc3-af09-b402a9f9cb2f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c7cfa288-9925-4bc3-af09-b402a9f9cb2f';

-- Record: ea532631-3b97-4842-9212-3bdeff62dc39 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ea532631-3b97-4842-9212-3bdeff62dc39';

-- Record: 9cdd1e3f-d37f-4b66-bc22-ed7c49f88c0d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9cdd1e3f-d37f-4b66-bc22-ed7c49f88c0d';

-- Record: f01aaca0-945c-4c46-8957-a04db3058baf (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f01aaca0-945c-4c46-8957-a04db3058baf';

-- Record: fa2fe3da-3449-4d9b-937a-e6ed2079d1c0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fa2fe3da-3449-4d9b-937a-e6ed2079d1c0';

-- Record: fe65db6b-d63a-474b-95b5-10b35ec3e95b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fe65db6b-d63a-474b-95b5-10b35ec3e95b';

-- Record: 0565bbcd-05a3-4391-92cb-912f3d4ec958 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0565bbcd-05a3-4391-92cb-912f3d4ec958';

-- Record: bb52121e-9b26-4820-a6d5-1957d35b8da9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bb52121e-9b26-4820-a6d5-1957d35b8da9';

-- Record: 6b0f38f4-9750-4417-98f7-435e61a908da (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6b0f38f4-9750-4417-98f7-435e61a908da';

-- Record: aef2d729-0f7e-41b0-9018-e1f50d46b0ab (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'aef2d729-0f7e-41b0-9018-e1f50d46b0ab';

-- Record: 1048bd09-f5bb-49a7-8155-8247c0dbc32d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1048bd09-f5bb-49a7-8155-8247c0dbc32d';

-- Record: fe8ba644-d695-4c87-a12f-c77f7580d1e9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fe8ba644-d695-4c87-a12f-c77f7580d1e9';

-- Record: 924c0448-4541-4138-94cd-176303eb91ec (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '924c0448-4541-4138-94cd-176303eb91ec';

-- Record: e9b727ca-23f5-4ea4-9512-01133e116a2d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e9b727ca-23f5-4ea4-9512-01133e116a2d';

-- Record: 35611f0d-69fc-48c3-99b7-ed5281bbe41a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '35611f0d-69fc-48c3-99b7-ed5281bbe41a';

-- Record: 2e4af96e-070e-4d83-8f5a-1d1506d49c51 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2e4af96e-070e-4d83-8f5a-1d1506d49c51';

-- Record: 446469c7-f7a3-4286-a3fc-6e1674b31a2c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '446469c7-f7a3-4286-a3fc-6e1674b31a2c';

-- Record: 8dfa7318-55eb-42ac-ad42-a6ae84376223 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8dfa7318-55eb-42ac-ad42-a6ae84376223';

-- Record: fc94519b-3ec0-438a-b219-d2f0235911fa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fc94519b-3ec0-438a-b219-d2f0235911fa';

-- Record: 5e6ba592-9514-479b-84b6-582bb7845a02 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5e6ba592-9514-479b-84b6-582bb7845a02';

-- Record: 8d86679d-17a8-498b-9520-bdc2e1904d3a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8d86679d-17a8-498b-9520-bdc2e1904d3a';

-- Record: d377f0d7-fc40-4eb3-8d9a-527794b39daa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd377f0d7-fc40-4eb3-8d9a-527794b39daa';

-- Record: 1150ee1b-f71e-4ec2-8b36-87eda9d20a35 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1150ee1b-f71e-4ec2-8b36-87eda9d20a35';

-- Record: da46e93b-132e-43a7-b174-70b9cb2d96ec (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'da46e93b-132e-43a7-b174-70b9cb2d96ec';

-- Record: 948ab551-3f8f-4bc3-8324-6c3897e949b2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '948ab551-3f8f-4bc3-8324-6c3897e949b2';

-- Record: 93017c68-55ee-4066-8828-dae06cbb5756 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '93017c68-55ee-4066-8828-dae06cbb5756';

-- Record: 72bf8c4c-5bee-44a4-a388-26c01249f63f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '72bf8c4c-5bee-44a4-a388-26c01249f63f';

-- Record: dffb1fd9-3711-40bc-984b-d2e8b0612188 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'dffb1fd9-3711-40bc-984b-d2e8b0612188';

-- Record: 1d56a032-aa3e-43c2-a867-7d4a74f68c9e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1d56a032-aa3e-43c2-a867-7d4a74f68c9e';

-- Record: 5ca9c6f5-6ac0-49e4-b51a-411c045829bf (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5ca9c6f5-6ac0-49e4-b51a-411c045829bf';

-- Record: ff7041fe-c20b-43c2-8942-c70d4d86c860 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ff7041fe-c20b-43c2-8942-c70d4d86c860';

-- Record: bb010825-6805-4236-9ce7-935b3acc3364 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bb010825-6805-4236-9ce7-935b3acc3364';

-- Record: 7cfe4593-36ba-446c-b06c-67989c4ac6b2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7cfe4593-36ba-446c-b06c-67989c4ac6b2';

-- Record: 86bdcc62-2243-49ae-a5e8-fc643cc13384 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '86bdcc62-2243-49ae-a5e8-fc643cc13384';

-- Record: 7cbedae7-9e39-4ffe-a45c-a79341cb9897 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7cbedae7-9e39-4ffe-a45c-a79341cb9897';

-- Record: af672449-246e-4a49-83b4-dc93fadde25d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'af672449-246e-4a49-83b4-dc93fadde25d';

-- Record: 976fccb8-a0c1-40b5-a5ad-9641653f0075 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '976fccb8-a0c1-40b5-a5ad-9641653f0075';

-- Record: b869466e-0d58-4079-9918-06a9e8a4282e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b869466e-0d58-4079-9918-06a9e8a4282e';

-- Record: ad34f777-89f3-4d33-b0ec-46cad747f4d4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ad34f777-89f3-4d33-b0ec-46cad747f4d4';

-- Record: da88fb74-3974-4953-8d90-75a4e4a6db27 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'da88fb74-3974-4953-8d90-75a4e4a6db27';

-- Record: 1054bf3e-7a7b-45f8-939d-b1500ff82811 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1054bf3e-7a7b-45f8-939d-b1500ff82811';

-- Record: 9a17ffaa-8ccb-443d-9777-dfa476236d29 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9a17ffaa-8ccb-443d-9777-dfa476236d29';

-- Record: edd57c47-4f8a-4584-afa9-fd87a90913ec (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'edd57c47-4f8a-4584-afa9-fd87a90913ec';

-- Record: 0e26307d-a6cb-41f8-92e0-959936c8b8ac (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0e26307d-a6cb-41f8-92e0-959936c8b8ac';

-- Record: eaf03469-b8be-461c-b863-643d75a91daa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'eaf03469-b8be-461c-b863-643d75a91daa';

-- Record: 644aca3b-f861-49ef-8181-9992dd4b1595 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '644aca3b-f861-49ef-8181-9992dd4b1595';

-- Record: 638d7c84-0ff9-4675-8b4a-f315e92e1c52 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '638d7c84-0ff9-4675-8b4a-f315e92e1c52';

-- Record: e256047f-3ced-434f-afa8-d4a6891fb002 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e256047f-3ced-434f-afa8-d4a6891fb002';

-- Record: 6f8b8121-de8c-4837-9fa2-ced5f9c64e6a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6f8b8121-de8c-4837-9fa2-ced5f9c64e6a';

-- Record: 6128dd78-3a42-4076-9d29-27b57a21f86e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6128dd78-3a42-4076-9d29-27b57a21f86e';

-- Record: 728dc571-4313-405c-b82a-f970f8e0b51d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '728dc571-4313-405c-b82a-f970f8e0b51d';

-- Record: 98e08ff9-b70f-4e35-ab0c-b842700a8548 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '98e08ff9-b70f-4e35-ab0c-b842700a8548';

-- Record: 92cffa0a-57c3-40a6-849d-a183f5a636d9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '92cffa0a-57c3-40a6-849d-a183f5a636d9';

-- Record: 4c696f58-f7e5-4d30-98ad-0c15f2f58742 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4c696f58-f7e5-4d30-98ad-0c15f2f58742';

-- Record: 4b294dec-ae6a-44a9-a14e-e2bcf7dda385 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4b294dec-ae6a-44a9-a14e-e2bcf7dda385';

-- Record: e982d06d-26ac-4279-9199-bc09f0b5c1a7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e982d06d-26ac-4279-9199-bc09f0b5c1a7';

-- Record: 7c45b802-58e5-4d18-a41f-a9264cf0b575 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7c45b802-58e5-4d18-a41f-a9264cf0b575';

-- Record: 605002d1-7b1d-40e7-a2ee-cc6170293588 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '605002d1-7b1d-40e7-a2ee-cc6170293588';

-- Record: 428c02b3-fc22-4baf-83d4-9d6c71393ef4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '428c02b3-fc22-4baf-83d4-9d6c71393ef4';

-- Record: 1858db86-8b19-4e46-aa1d-c151efe1b88a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1858db86-8b19-4e46-aa1d-c151efe1b88a';

-- Record: f4e5ad16-90ce-4ffb-8e8d-1c02fecf23ef (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f4e5ad16-90ce-4ffb-8e8d-1c02fecf23ef';

-- Record: bc343b7f-fc0a-4086-b794-b9fbc46ddceb (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bc343b7f-fc0a-4086-b794-b9fbc46ddceb';

-- Record: b6e83a2c-d080-40ac-88d1-78b46382c78a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b6e83a2c-d080-40ac-88d1-78b46382c78a';

-- Record: 4bab35c0-d07f-4572-a766-fe6af66b6176 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4bab35c0-d07f-4572-a766-fe6af66b6176';

-- Record: e05873a2-1eab-44e8-bcef-b3a53800c782 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e05873a2-1eab-44e8-bcef-b3a53800c782';

-- Record: 462379f5-0416-4c20-8067-52ffbf0dc624 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '462379f5-0416-4c20-8067-52ffbf0dc624';

-- Record: a6636a3a-df72-478c-9629-b9d2e1218be4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a6636a3a-df72-478c-9629-b9d2e1218be4';

-- Record: 83a6c0a8-7d6c-4e2f-b6f3-d94d67ae6b2a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '83a6c0a8-7d6c-4e2f-b6f3-d94d67ae6b2a';

-- Record: c10dd4bd-8daa-4b89-9a31-06af0f9d8cec (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c10dd4bd-8daa-4b89-9a31-06af0f9d8cec';

-- Record: c3e01a0f-e195-415c-b888-8df86fd9ed91 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c3e01a0f-e195-415c-b888-8df86fd9ed91';

-- Record: ec3b3732-be8c-4b23-8716-909ec16e0ae8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ec3b3732-be8c-4b23-8716-909ec16e0ae8';

-- Record: eb0fc855-dc9f-4190-9d7e-1d1097954e23 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'eb0fc855-dc9f-4190-9d7e-1d1097954e23';

-- Record: 68e4eb20-e565-4493-b595-137c5a78894a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '68e4eb20-e565-4493-b595-137c5a78894a';

-- Record: 2661f628-dbb3-4910-bcb0-84bd8ec1ead1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2661f628-dbb3-4910-bcb0-84bd8ec1ead1';

-- Record: a40c74ef-eac4-49e6-a873-9544acd90fd3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a40c74ef-eac4-49e6-a873-9544acd90fd3';

-- Record: baf36eb7-6065-43ee-81be-47cc4d4bedbd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'baf36eb7-6065-43ee-81be-47cc4d4bedbd';

-- Record: a2b9dd82-5959-4e43-9498-dff4b00d68c8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a2b9dd82-5959-4e43-9498-dff4b00d68c8';

-- Record: 595b3b3a-dc52-45f9-805b-461d11ffb3fa (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '595b3b3a-dc52-45f9-805b-461d11ffb3fa';

-- Record: 705830ec-d742-4bff-b9cc-c2348d695fd4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '705830ec-d742-4bff-b9cc-c2348d695fd4';

-- Record: a62012df-c9fd-4676-83cb-4b9f90174a8f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a62012df-c9fd-4676-83cb-4b9f90174a8f';

-- Record: 612e021e-4c0e-4bf2-8cfb-c2b8662c4c9a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '612e021e-4c0e-4bf2-8cfb-c2b8662c4c9a';

-- Record: 694156ef-0748-4b70-935b-95b5c6d00b0f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '694156ef-0748-4b70-935b-95b5c6d00b0f';

-- Record: 38550683-9f3d-40be-a224-d0051ca420ff (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '38550683-9f3d-40be-a224-d0051ca420ff';

-- Record: dd91e003-8121-4d98-9419-f80ba72057ee (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'dd91e003-8121-4d98-9419-f80ba72057ee';

-- Record: daa3f7fa-d7d9-47e1-adc2-37f826a00b3e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'daa3f7fa-d7d9-47e1-adc2-37f826a00b3e';

-- Record: d1c162f2-3e7f-40de-8bd3-4b83066a6f3a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd1c162f2-3e7f-40de-8bd3-4b83066a6f3a';

-- Record: 54e1acda-174c-400b-8582-60b5507faa6a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '54e1acda-174c-400b-8582-60b5507faa6a';

-- Record: 08ec0a75-816d-4a2e-abe8-6f2a2a57a20b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '08ec0a75-816d-4a2e-abe8-6f2a2a57a20b';

-- Record: 2d83ec38-2e36-4a8f-b8b3-03c0ff5c4c03 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2d83ec38-2e36-4a8f-b8b3-03c0ff5c4c03';

-- Record: adbed19e-60d9-4eeb-b737-28efc0b48fab (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'adbed19e-60d9-4eeb-b737-28efc0b48fab';

-- Record: f91d7493-e7e7-4cd7-94ec-12f171295cb6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f91d7493-e7e7-4cd7-94ec-12f171295cb6';

-- Record: 697f4cba-5e98-4e0c-85d5-53b026cab2c8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '697f4cba-5e98-4e0c-85d5-53b026cab2c8';

-- Record: d6a3ee74-7007-4cc8-9035-d2e0b5e71f4f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd6a3ee74-7007-4cc8-9035-d2e0b5e71f4f';

-- Record: 496bc896-0a9b-4e6c-8aaa-42aa76cf0708 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '496bc896-0a9b-4e6c-8aaa-42aa76cf0708';

-- Record: ff56b4c1-64a2-4786-a635-b2d3ccfa7a37 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'ff56b4c1-64a2-4786-a635-b2d3ccfa7a37';

-- Record: 56e53867-c1e9-45a3-ab22-b47b23d40442 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '56e53867-c1e9-45a3-ab22-b47b23d40442';

-- Record: 16016c8e-43fb-42d6-bbda-405f1c811b5c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '16016c8e-43fb-42d6-bbda-405f1c811b5c';

-- Record: cf2b3836-877c-4865-a562-f6b8b0e02ba6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cf2b3836-877c-4865-a562-f6b8b0e02ba6';

-- Record: daa95e48-c6a6-456d-997e-92d19c19fb52 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'daa95e48-c6a6-456d-997e-92d19c19fb52';

-- Record: 1d4f676c-4285-4518-bb0d-d329871711fd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1d4f676c-4285-4518-bb0d-d329871711fd';

-- Record: 03131925-bea0-4161-9406-16a3aded557c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '03131925-bea0-4161-9406-16a3aded557c';

-- Record: 6f612f59-3c6d-409d-aa16-418b50cb2c6e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6f612f59-3c6d-409d-aa16-418b50cb2c6e';

-- Record: 4d80296c-e30f-40c5-bc79-6fe4b64f5c22 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4d80296c-e30f-40c5-bc79-6fe4b64f5c22';

-- Record: 8323dfb2-165b-4646-9ae1-c515e32efeaf (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8323dfb2-165b-4646-9ae1-c515e32efeaf';

-- Record: 0db5ea61-9821-4752-8548-e7f0d61f2d11 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0db5ea61-9821-4752-8548-e7f0d61f2d11';

-- Record: 92e302c8-a83c-42ca-ad98-3db7ab04b810 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '92e302c8-a83c-42ca-ad98-3db7ab04b810';

-- Record: 4d8b3857-80c8-46de-9795-d1ec8ad0b539 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4d8b3857-80c8-46de-9795-d1ec8ad0b539';

-- Record: 87535d77-12f6-4cd5-a0dd-a6e861c8c48c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '87535d77-12f6-4cd5-a0dd-a6e861c8c48c';

-- Record: d0886ff0-4b93-4754-aed7-ba512ee9dc92 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd0886ff0-4b93-4754-aed7-ba512ee9dc92';

-- Record: 455924cf-7018-484c-9a43-97b8d3cee0ab (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '455924cf-7018-484c-9a43-97b8d3cee0ab';

-- Record: 48295335-c536-43cc-ba70-271ccbc5fca4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '48295335-c536-43cc-ba70-271ccbc5fca4';

-- Record: 232bbac3-2496-4002-ae7a-8b2f34c2cce7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '232bbac3-2496-4002-ae7a-8b2f34c2cce7';

-- Record: 8b9ca476-eb26-468e-a10f-f21591b1b894 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8b9ca476-eb26-468e-a10f-f21591b1b894';

-- Record: c9b43a68-92e4-439a-9a80-0e3fb77f31b2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c9b43a68-92e4-439a-9a80-0e3fb77f31b2';

-- Record: 1e2f357d-8f92-4615-bd39-749a93b1cd93 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1e2f357d-8f92-4615-bd39-749a93b1cd93';

-- Record: 9ec9de77-021f-46e6-b599-b7d742f9cff4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '9ec9de77-021f-46e6-b599-b7d742f9cff4';

-- Record: 3b72a3e3-c73b-4d7a-8a34-8d3a99d992f8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3b72a3e3-c73b-4d7a-8a34-8d3a99d992f8';

-- Record: fd777cfe-7a86-4673-8830-5869cfbb4f84 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fd777cfe-7a86-4673-8830-5869cfbb4f84';

-- Record: 3c73946a-b2e6-4c53-8f1f-b4f182b283b3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3c73946a-b2e6-4c53-8f1f-b4f182b283b3';

-- Record: 22d5e977-76a9-4d01-8a1b-a865f1512e08 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '22d5e977-76a9-4d01-8a1b-a865f1512e08';

-- Record: 2f08f0af-5d0c-4cc7-a302-92519001da49 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2f08f0af-5d0c-4cc7-a302-92519001da49';

-- Record: 506c79d4-788c-4805-b083-7251bc318ad8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '506c79d4-788c-4805-b083-7251bc318ad8';

-- Record: b4d2d4bd-b3c7-49e6-a9bc-6893982f03b7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b4d2d4bd-b3c7-49e6-a9bc-6893982f03b7';

-- Record: 7a05624f-7688-4621-a873-493d2a20b33d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7a05624f-7688-4621-a873-493d2a20b33d';

-- Record: cce63ec8-4621-4cf7-96d0-1a9112631692 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cce63ec8-4621-4cf7-96d0-1a9112631692';

-- Record: b3bbfcf4-eb7d-4333-b8f3-dee3831cdc05 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b3bbfcf4-eb7d-4333-b8f3-dee3831cdc05';

-- Record: 1bf91945-34f6-4c5e-a3d7-3d230269475c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1bf91945-34f6-4c5e-a3d7-3d230269475c';

-- Record: daf26491-d6df-4d9c-a450-3d8a721bbd6a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'daf26491-d6df-4d9c-a450-3d8a721bbd6a';

-- Record: 614a9fd2-af4e-4cf1-8f92-5975770ca781 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '614a9fd2-af4e-4cf1-8f92-5975770ca781';

-- Record: 8124270c-2141-405e-bf4d-405c5bcb59fc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '8124270c-2141-405e-bf4d-405c5bcb59fc';

-- Record: 7f4f152d-2f72-4856-9648-452c87f30e7a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7f4f152d-2f72-4856-9648-452c87f30e7a';

-- Record: 526e3401-4588-408f-a994-04cb33cd45b5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '526e3401-4588-408f-a994-04cb33cd45b5';

-- Record: 5f4a04ee-5809-4e76-9405-e75aa210f7a2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5f4a04ee-5809-4e76-9405-e75aa210f7a2';

-- Record: 233587e3-1cf4-4499-a856-eb7884ecbf27 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '233587e3-1cf4-4499-a856-eb7884ecbf27';

-- Record: c73e37a9-5910-45b6-9046-58995d0b26cc (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c73e37a9-5910-45b6-9046-58995d0b26cc';

-- Record: 488285d7-8c43-4b48-a423-d7de0f24e968 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '488285d7-8c43-4b48-a423-d7de0f24e968';

-- Record: 1ba0d368-7867-4e0d-8e0d-4559eae2406b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1ba0d368-7867-4e0d-8e0d-4559eae2406b';

-- Record: 7802c126-4118-4313-a51e-fa1488ab424b (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '7802c126-4118-4313-a51e-fa1488ab424b';

-- Record: 64ea59cd-42ae-4691-bf61-930e6bd7daea (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '64ea59cd-42ae-4691-bf61-930e6bd7daea';

-- Record: 5a480bb8-384b-4c77-aeb7-87d80c08566f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5a480bb8-384b-4c77-aeb7-87d80c08566f';

-- Record: 82c5325d-04db-43a1-9506-d79c768261e9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '82c5325d-04db-43a1-9506-d79c768261e9';

-- Record: 98c9bacf-d280-4dfd-86cf-20532ca23998 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '98c9bacf-d280-4dfd-86cf-20532ca23998';

-- Record: c01a366a-d3b4-4c68-aeaa-ac979f5e8689 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c01a366a-d3b4-4c68-aeaa-ac979f5e8689';

-- Record: 304f0bc3-397d-48a7-902c-a93257a6de03 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '304f0bc3-397d-48a7-902c-a93257a6de03';

-- Record: da2630b4-693f-46ee-9b0d-f13a12d894fd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'da2630b4-693f-46ee-9b0d-f13a12d894fd';

-- Record: 20d9e730-6d34-4eca-90e8-e2db4ffbf933 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '20d9e730-6d34-4eca-90e8-e2db4ffbf933';

-- Record: 6e43dd3a-07e2-47ac-bcda-bd8a3baf1e52 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '6e43dd3a-07e2-47ac-bcda-bd8a3baf1e52';

-- Record: bc851bd6-be8e-4eff-868e-2f4dfb43cef1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bc851bd6-be8e-4eff-868e-2f4dfb43cef1';

-- Record: 54f2a459-1baf-425e-90b7-eee5f4af46ac (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '54f2a459-1baf-425e-90b7-eee5f4af46ac';

-- Record: dbe7a9de-ecf4-4143-92f7-87416bb56f51 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'dbe7a9de-ecf4-4143-92f7-87416bb56f51';

-- Record: 15974d59-4dcb-4c1d-930f-0f64c872e682 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '15974d59-4dcb-4c1d-930f-0f64c872e682';

-- Record: 98a0e31d-9d07-409f-9cae-1f054e5bd93e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '98a0e31d-9d07-409f-9cae-1f054e5bd93e';

-- Record: 363d2187-928c-4001-baf9-cffc7b3a0e90 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '363d2187-928c-4001-baf9-cffc7b3a0e90';

-- Record: 4b2178d1-c296-41f6-8146-0f787d1272e0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4b2178d1-c296-41f6-8146-0f787d1272e0';

-- Record: 329d0ab9-4caf-484b-8eda-9ad18e4ba619 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '329d0ab9-4caf-484b-8eda-9ad18e4ba619';

-- Record: 48e80004-8eb6-46af-8130-849a7e55db4c (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '48e80004-8eb6-46af-8130-849a7e55db4c';

-- Record: 77cecd90-e7a5-4444-b281-62cc8c42df9f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '77cecd90-e7a5-4444-b281-62cc8c42df9f';

-- Record: 46c5324a-d64e-4b06-aa89-096b3e2a23d2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '46c5324a-d64e-4b06-aa89-096b3e2a23d2';

-- Record: 4aabbabf-740f-4e1b-bacf-216e6352c3f0 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '4aabbabf-740f-4e1b-bacf-216e6352c3f0';

-- Record: 0d8363aa-9fd2-44a3-89eb-c51d0ed80d06 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0d8363aa-9fd2-44a3-89eb-c51d0ed80d06';

-- Record: 1dc4df5e-5baf-4048-9c8f-40bfbc00ae4d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1dc4df5e-5baf-4048-9c8f-40bfbc00ae4d';

-- Record: d4c49ec8-3f94-4a89-a342-fc62587ddfb6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd4c49ec8-3f94-4a89-a342-fc62587ddfb6';

-- Record: 3aaa5890-b5fe-490f-86a1-c3e3c24abc40 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3aaa5890-b5fe-490f-86a1-c3e3c24abc40';

-- Record: 0ad54de7-ef58-47b2-beb8-dcd72efcf928 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0ad54de7-ef58-47b2-beb8-dcd72efcf928';

-- Record: d259b608-63d1-48b6-ba20-8595bca31fe3 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd259b608-63d1-48b6-ba20-8595bca31fe3';

-- Record: d50496b1-3fe8-44d9-acc8-10ecc675d6ed (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd50496b1-3fe8-44d9-acc8-10ecc675d6ed';

-- Record: 883451b5-fce8-4437-ac15-a573e5045ed2 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '883451b5-fce8-4437-ac15-a573e5045ed2';

-- Record: 3b3fed45-bf6c-45db-a0e9-b5f7f5ef2955 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3b3fed45-bf6c-45db-a0e9-b5f7f5ef2955';

-- Record: e2a43f6c-9265-414a-8de6-2d6a292c5720 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e2a43f6c-9265-414a-8de6-2d6a292c5720';

-- Record: 3fdb9d51-007a-4cdb-b751-b83215220e44 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '3fdb9d51-007a-4cdb-b751-b83215220e44';

-- Record: 79aa04d3-b9a3-4ce2-b6ec-25f7e044a1d8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '79aa04d3-b9a3-4ce2-b6ec-25f7e044a1d8';

-- Record: f58967d5-281a-4077-a405-b389ca010ca9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'f58967d5-281a-4077-a405-b389ca010ca9';

-- Record: c87c43cd-6ad2-47a1-9f5a-2d127e9bf3c8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'c87c43cd-6ad2-47a1-9f5a-2d127e9bf3c8';

-- Record: 5955bed0-caea-40d1-b64a-0ae8288315e8 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5955bed0-caea-40d1-b64a-0ae8288315e8';

-- Record: 687c9b04-2b65-4d3e-aae3-fc5f092ec362 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '687c9b04-2b65-4d3e-aae3-fc5f092ec362';

-- Record: bde05e2d-e6c6-41df-b121-7f69f737f1d4 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'bde05e2d-e6c6-41df-b121-7f69f737f1d4';

-- Record: 470fed74-37b1-4ba3-9fd3-b7a39f67ab8f (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '470fed74-37b1-4ba3-9fd3-b7a39f67ab8f';

-- Record: 81d5b000-cc7b-4ff2-bcc1-2c37ff76f43d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '81d5b000-cc7b-4ff2-bcc1-2c37ff76f43d';

-- Record: 0ddc319d-13db-4bd9-8394-47ee69043845 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '0ddc319d-13db-4bd9-8394-47ee69043845';

-- Record: a4472ac8-57b9-4140-877a-d48951b04e72 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a4472ac8-57b9-4140-877a-d48951b04e72';

-- Record: d278ec06-709a-4837-ace7-144ee340b610 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'd278ec06-709a-4837-ace7-144ee340b610';

-- Record: 663c8f0a-6170-4487-b42c-a2c9d7a5f45e (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '663c8f0a-6170-4487-b42c-a2c9d7a5f45e';

-- Record: a0491491-4275-4636-903c-4673582f18b9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a0491491-4275-4636-903c-4673582f18b9';

-- Record: cbbbe000-27d8-4ece-96fc-13b3fa635a85 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'cbbbe000-27d8-4ece-96fc-13b3fa635a85';

-- Record: 5a198c81-e209-412d-840d-035304a3bcb7 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '5a198c81-e209-412d-840d-035304a3bcb7';

-- Record: 760656d5-448d-4c38-8ca2-2f1e3504d670 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '760656d5-448d-4c38-8ca2-2f1e3504d670';

-- Record: 1c4fde4e-1ee6-4db9-b039-179d78dcccb5 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '1c4fde4e-1ee6-4db9-b039-179d78dcccb5';

-- Record: b7e79e00-747f-4f33-841d-30e8a07fb653 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'b7e79e00-747f-4f33-841d-30e8a07fb653';

-- Record: fb5345bb-52bd-415c-b531-cb3c33a895d6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'fb5345bb-52bd-415c-b531-cb3c33a895d6';

-- Record: 04639a30-ce7e-4181-b8a6-6c66af88f08a (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '04639a30-ce7e-4181-b8a6-6c66af88f08a';

-- Record: aef04b1f-d826-4505-9a36-3e180f2e3ff1 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'aef04b1f-d826-4505-9a36-3e180f2e3ff1';

-- Record: e8af8802-7c78-42e7-8f58-343119b5615d (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = 'e8af8802-7c78-42e7-8f58-343119b5615d';

-- Record: 2ddd0e57-a133-4c65-a570-1d732b0bbcdd (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '2ddd0e57-a133-4c65-a570-1d732b0bbcdd';

-- Record: 10078dff-08af-4240-b39e-c0105de41fe6 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '10078dff-08af-4240-b39e-c0105de41fe6';

-- Record: 45db7cd4-4396-4a12-9674-9a7105ebb7d9 (Type: fill-in-the-blank, Options: [])
SELECT * FROM kedge_practice.quizzes WHERE id = '45db7cd4-4396-4a12-9674-9a7105ebb7d9';


-- Example fixes:
-- UPDATE kedge_practice.quizzes SET options = '["Option A", "Option B", "Option C", "Option D"]'::jsonb WHERE id = 'some-uuid';
-- DELETE FROM kedge_practice.quizzes WHERE options IS NULL AND type = 'single-choice';

COMMIT;
