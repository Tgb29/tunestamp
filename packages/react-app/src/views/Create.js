import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import '../styles/create.scss';

const Create = () => {
    const history = useHistory();
    const [uploadedFile, setUploadedFile] = useState();
    const [uploadedFileType, setUploadedFileType] = useState();
    const [preSignedUrl, setPreSignedUrl] = useState();
    const [displayPreview, setDisplayPreview] = useState();
    const [previewUrl, setPreviewUrl] = useState();

    const [formInput, setFormInput] = useState({});
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [mintedToken, setMintedToken] = useState();
    const [imageUpload, setImageUpload] = useState({ inProgress: false, complete: false });
    const [inProgress, setInProgress] = useState(false);
    const [fileName, setFileName] = useState();

    useEffect(() => {
        console.log(imageUpload);
    }, [imageUpload]);

    useEffect(() => {
        // Get presigned url
        if (uploadedFile) {
            setInProgress(true);
            async function postData(url = '', body) {
                const response = await fetch(url, {
                    method: 'POST',
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    redirect: 'follow',
                    referrerPolicy: 'no-referrer',
                    body: JSON.stringify(body),
                });
                return response.json();
            }

            postData('https://app.sudocoins.com/art/start-mint', { file_ext: uploadedFileType }).then((data) => {
                setFileName(data.file_name);
                setPreviewUrl(`https://cdn.sudocoins.com/${data.file_name}`);
                setPreSignedUrl(data.presigned_url);
            });
        }
    }, [uploadedFile]);

    useEffect(() => {
        // Save to S3 bucket
        if (preSignedUrl) {
            setImageUpload({ inProgess: true, complete: false });
            async function uploadFileToS3(url, file) {
                let formData = new FormData();
                formData.append('file', file);

                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': file.type,
                    },
                    body: file,
                });
                return response;
            }

            uploadFileToS3(preSignedUrl, uploadedFile).then((response) => {
                if (response.ok) {
                    setDisplayPreview(true);
                    setImageUpload({ inProgess: false, complete: true });
                } else {
                    console.log('image upload error', response);
                }
            });
        }
    }, [preSignedUrl]);

    useEffect(() => {
        if (displayPreview) {
            setImageUpload({ inProgess: false, complete: true });
            setInProgress(false);
        }
    }, [displayPreview]);

    // useEffect(() => {
    //     if (uploadSuccess) {
    //         history.push(`/art/${fileName.split('.')[0]}`);
    //     }
    // }, [uploadSuccess]);

    const handleImageUpload = (e) => {
        e.preventDefault();
        const files = document.querySelector('[type=file]').files;
        getFileExtension(files[0]);
        setUploadedFile(files[0]);
        setImageUpload({ inProgess: true, complete: false });
    };

    const getFileExtension = (file) => {
        let fileTypeStrings = file.type.split('/');
        let fileType = fileTypeStrings[fileTypeStrings.length - 1];
        setUploadedFileType(fileType);
    };

    const rarepress = new Rarepress();

    const mint = async (account) => {
        const cid = await rarepress.add(previewUrl);
        let token = await rarepress.create({
            metadata: {
                name: formInput.name,
                description: formInput.description,
                image: '/ipfs/' + cid,
            },
            royalties: [
                {
                    account: account,
                    value: formInput.royalties * 100,
                },
                {
                    account: '0x5F5b7c5c23f2826b0fDc25D21944bCEaf146FD78',
                    value: 300,
                },
            ],
        });
        return token;
    };

    const sell = async (token) => {
        setMintedToken(token);
        let trade = await rarepress.trade.create({
            what: {
                type: 'ERC721',
                id: token.tokenId,
            },
            with: {
                type: 'ETH',
                value: formInput.price * 10 ** 18,
            },
        });
        return trade;
    };

    const mintAndSell = async (e) => {
        e.preventDefault();
        let account = await rarepress.init({ host: 'https://rarepress.org/v0' });
        // let account = await rarepress.init({ host: 'https://rinkeby.rarepress.org/v0' });
        let token = await mint(account);
        let trade = await sell(token);
        if (token && trade) {
            saveNft({ id: token.id, creators: token.creators, uri: token.uri, royalties: token.royalties });
            setUploadSuccess(true);
        }
    };

    const saveNft = (mintedResponse) => {
        const saveToDatabase = async (url, body) => {
            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(body),
            });
            return response.json();
        };

        saveToDatabase('https://app.sudocoins.com/art/end-mint', {
            file_name: fileName,
            form_data: formInput,
            mint_response: mintedResponse,
        });
    };

    return (
        <div className='page'>
            {!uploadSuccess && (
                <div className='create'>
                    <div className='create-header'>
                        <h1>Create an NFT</h1>
                    </div>
                    <div className='create-form form'>
                        <form
                            className='file-upload'
                            method='post'
                            encType='multipart/form-data'
                            onSubmit={handleImageUpload}
                        >
                            {/* <label htmlFor='nft-upload-btn'>PNG, GIF, WEBP, MP4 or MP3. Max 100mb.</label> */}
                            <label htmlFor='nft-upload-btn'>PNG, JPEG, JPG, GIF. Max 100mb.</label>
                            <input
                                type='file'
                                id='nft-upload-btn'
                                name='nft-upload-btn'
                                onChange={handleImageUpload}
                                // accept='image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,audio/mp3,audio/webm,audio/mpeg'
                                accept='image/png,image/jpeg,image/gif'
                                title='Drag drop file'
                            />
                        </form>

                        {inProgress && <p>uploading image</p>}

                        <form name='nft mint' autoComplete='off'>
                            <div className='form'>
                                <div className='label-wrapper'>
                                    <label htmlFor='name' className='label-top'>
                                        Name*
                                    </label>
                                    <input
                                        name='name'
                                        id='name'
                                        type='text'
                                        value={formInput.name}
                                        placeholder='Name'
                                        onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
                                    />
                                </div>

                                <div className='label-wrapper'>
                                    <label htmlFor='description' className='label-top'>
                                        Description
                                    </label>
                                    <textarea
                                        name='description'
                                        id='description'
                                        type='text'
                                        value={formInput.description}
                                        placeholder='Provide a detailed description of your item'
                                        onChange={(e) => setFormInput({ ...formInput, description: e.target.value })}
                                    />
                                </div>

                                <div className='label-wrapper'>
                                    <label htmlFor='price' className='label-top'>
                                        Price*
                                    </label>
                                    <input
                                        name='price'
                                        id='price'
                                        type='number'
                                        min='0'
                                        value={formInput.price}
                                        placeholder='0 ETH'
                                        onChange={(e) => setFormInput({ ...formInput, price: e.target.value })}
                                        step='.001'
                                    />
                                </div>

                                <div className='label-wrapper'>
                                    <label htmlFor='royalties' className='label-top'>
                                        Royalties*
                                    </label>
                                    <input
                                        name='royalties'
                                        id='royalties'
                                        type='number'
                                        min='1'
                                        max='50'
                                        id='royalties'
                                        value={formInput.royalties}
                                        placeholder='Suggested: 0%, 2%, 5%. Maximum is 50%.'
                                        onChange={(e) => setFormInput({ ...formInput, royalties: e.target.value })}
                                    />
                                </div>

                                <button
                                    className='button-purple'
                                    // disabled={!mintSuccess}
                                    onClick={mintAndSell}
                                >
                                    Mint & Sell
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className='create-preview'>{displayPreview && <img src={previewUrl} alt='' />}</div>
                    {/* <div className='create-preview'>
                        {previewUrl && (
                            <div className='card'>
                                <div className='card-image'>
                                    <img src={previewUrl} alt='' />
                                </div>
                                <p className='card-title'>DystoPunk V2 #1817</p>
                                <p className='card-subtitle'>$4,300</p>
                            </div>
                        )}
                    </div> */}
                </div>
            )}

            {uploadSuccess && (
                <div className=''>
                    <h1>Congrats, you listed an NFT to sell!</h1>

                    <div className='grid'>
                        {mintedToken && (
                            <a href={`https://rarible.com/token/${mintedToken.id}`} target='_blank'>
                                View listing
                            </a>
                        )}
                        <a href={`https://app.sudocoins.com/art/social/${fileName.split('.')[0]}`}>Share your item</a>
                        <a href='/create'>Create another NFT</a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Create;