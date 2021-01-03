import os
import sys
import re
import json
import socket
import threading
import argparse


def fn(conn, address):

    chunks = []

    while True:

        data = conn.recv(4096)

        if data == b'':
            break
        else:
            chunks.append(data)

    data = b''.join(chunks).decode('utf-8')

    data = json.loads(data)

    matches = []

    for match in re.finditer(data['regexInput'], data['textInput']):
        
        matches.append({'match': match.group(), 'index': match.span()[0]})
        
    data = json.dumps(matches)

    return data


if __name__ == "__main__":

    try:

        parser = argparse.ArgumentParser()
        parser.add_argument('--host', help='set the host', type=str)
        parser.add_argument('--port', help='set the port', type=int)
        args = parser.parse_args()

        host = 'localhost' if args.host == None else args.host
        port = 65535 if args.port == None else args.port

        serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        serversocket.bind((host, port))
        serversocket.listen(0)
        
        while True:
            
            (conn, address) = serversocket.accept()
            
            data = fn(conn, address)
            conn.sendall(data.encode('utf-8'))
            conn.close()

    except Exception as e:

        raise

        # with open('exception.txt', 'w') as f:
        #     f.write(host)
        #     f.write(str(port))
        #     f.write(e)