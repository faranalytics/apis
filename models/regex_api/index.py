#!/usr/bin/env python
# coding: utf-8

# In[3]:


import os as os

try: 
    _working_directory = os.path.dirname(_os.path.realpath(__file__))
except NameError:
    _working_directory = os.getcwd()
    
import sys
import re
import json

os.chdir(_working_directory)

with open('input.json', 'r') as f:
    data = json.load(f)

regexInput = data['regexInput']

textInput = data['textInput']

matches = []

for match in re.finditer(regexInput, textInput):
    
    matches.append({'match': match.group(), 'index': match.span()[0]})
    
with open('output.json', 'w') as f:
    json.dump(matches, f)

