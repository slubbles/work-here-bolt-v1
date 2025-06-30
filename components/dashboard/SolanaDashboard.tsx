<div className="flex items-center gap-3">
                 {token.image ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <img 
                      src={token.image} 
                      alt={token.symbol} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = ''; 
                        // Replace with div containing first letter
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `
                          <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-black rounded-full flex items-center justify-center">
                            <span class="text-white font-bold">${(token.symbol || '?')[0]}</span>
                            <span class="sr-only">${token.symbol || 'Token'}</span>
                          </div>
                        `;
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-black rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{(token.symbol || '?')[0]}</span>
                    <span className="sr-only">{token.symbol || 'Token'}</span>
                  </div>
                )}
                  <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                  />
                  </div>
                </div>