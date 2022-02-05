import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { ethers } from "ethers";

function Home() {

  const history = useHistory();
  const [uploadedFile, setUploadedFile] = useState();
  const [uploadedFileType, setUploadedFileType] = useState();
  const [preSignedUrl, setPreSignedUrl] = useState();
  const [displayPreview, setDisplayPreview] = useState();
  const [previewUrl, setPreviewUrl] = useState();

  const [formInput, setFormInput] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [mintedToken, setMintedToken] = useState();
  const [songUpload, setImageUpload] = useState({ inProgress: false, complete: false });
  const [inProgress, setInProgress] = useState(false);
  const [fileName, setFileName] = useState();

  useEffect(() => {
    console.log(songUpload);
}, [songUpload]);

useEffect(() => {
  // Get AWS presigned url
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
              console.log('song upload error', response);
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

  return (
    
    <div>
      <div style={{ margin: 32 }}>
        <span style={{ marginRight: 8 }}></span>
        Every song has its own unique TuneStamp.
      </div>
      <div style={{ margin: 32 }}>
        <span style={{ marginRight: 8 }}></span>
        Upload your music and create TuneStamp NFTs.
      </div>
      <div style={{ margin: 32 }}>
        <span style={{ marginRight: 8 }}></span>
        If the TuneStamp already exists, try another song. No duplicates.
        
      </div>
      {!uploadSuccess && (
      <div >

          <div style={{ margin: 32 }}>
            <form
              className='file-upload'
              method='post'
              encType='multipart/form-data'
              onSubmit={handleImageUpload}
            >
              <input
                  type='file'
                  id='nft-upload-btn'
                  name='nft-upload-btn'
                  onChange={handleImageUpload}
                  accept='image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,audio/mp3,audio/webm,audio/mpeg'
                  // accept='audio/mp3,audio/webm,audio/mpeg'
                  title='Drag and drop song'
              />
            </form>

              {inProgress && <p>uploading image</p>}

              <form name='nft mint' autoComplete='off'>
                  <div style={{ margin: 32 }}>
                      <div >
                          <input
                              name='name'
                              id='name'
                              type='text'
                              value={formInput.name}
                              placeholder='Song Name'
                              onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
                          />
                      </div>

                      <div style={{ margin: 32 }}>
                          <input
                              name='artist'
                              id='artist'
                              type='text'
                              value={formInput.artist}
                              placeholder='Artist Name'
                              onChange={(e) => setFormInput({ ...formInput, artist: e.target.value })}
                          />
                      </div>

                      <button onClick={setInProgress}>
                          Mint 
                      </button>
                  </div>
              </form>
          </div>
          <div >{displayPreview && <img src={previewUrl} />}</div>
    </div>
    )   }
    </div>
  );
}

export default Home;
