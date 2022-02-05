import boto3
import uuid
import json
import matplotlib.pyplot as plt
import numpy as np
import wave
import sys
import requests

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):

    #download song from s3
    #song =wave.open({song from s3}, "r")
    #song_id = file ext of song from s3

    spf = wave.open("Animal_cut.wav", "r")

    # Extract Raw Audio from Wav File
    signal = spf.readframes(-1)
    signal = np.fromstring(signal, "Int16")
    fs = spf.getframerate()

    # If Stereo
    if spf.getnchannels() == 2:
        print("Just mono files")
        sys.exit(0)


    Time = np.linspace(0, len(signal) / fs, num=len(signal))

    plt.figure(1)
    plt.title("Signal Wave...")
    plt.plot(Time, signal)
    plt.show()

    tunestamp = plt.savefig('foo.jpeg')
    #plt.savefig('song_id.jpeg')

    #upload image to s3

    return #result


def set_ipfs_image(file_name):
    s3 = boto3.resource('s3')
    tmp = "/tmp/" + file_name
    s3.meta.client.download_file('sudocoins-art-bucket', file_name, tmp)

    with open(tmp, 'rb') as file:
        files = {
            'file': file
        }
        response = requests.post('https://ipfs.infura.io:5001/api/v0/add', files=files,
                                 auth=('1xBSq6KuqrbDmhs2ASr722Cs8JF', '3c98ebb9f76fabc45d519718e41dd4f0'))

        response2 = json.loads(response.text)

        return {
            "ipfs_image": response2['Hash']
        }


