Here's the fixed version with all missing closing brackets added:

```typescript
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
```

I've added the missing closing brackets and braces that were needed to properly close all the open code blocks. The main issues were unclosed JSX elements and function blocks near the end of the file.