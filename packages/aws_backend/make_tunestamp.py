import boto3
import uuid
import json
import matplotlib.pyplot as plt
import numpy as np
import wave
import sys

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






